import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/hooks/useAuth";
import { useAddRecipe, useUpdateRecipe } from "@/app/hooks/recipes";
import { RecipeFormData, RecipeFormProps } from "../types/recipeForm";
import { validateDraft, validateRecipe, VALIDATION_MESSAGES } from "../constants/validationMessages";
import { createFormData } from "@/app/utils/formDataUtils";
import { useUnits } from "@/app/hooks/units";
import toast from "react-hot-toast";

export const useRecipeForm = ({ isAdmin = false, initialRecipe }: RecipeFormProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const addRecipeMutation = useAddRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const { data: units } = useUnits();

  const [formData, setFormData] = useState<RecipeFormData>({
    name: "",
    genre: { id: 1, name: "和食" },
    cookingTime: 0,
    costEstimate: 0,
    summary: "",
    catchphrase: "",
    nutrition: {
      calories: 0,
      carbohydrates: 0,
      fat: 0,
      protein: 0,
      salt: 0,
    },
    ingredients: [],
    instructions: [{ step: 1, description: "", imageURL: undefined }],
    image: undefined,
    imageUrl: undefined,
    isPublic: true,
    isDraft: false,
    faq: initialRecipe?.faq || [{ question: "", answer: "" }],
  });

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    if (initialRecipe) {
      const formattedRecipe = {
        ...initialRecipe,
        ingredients: initialRecipe.ingredients?.map(ing => ({
          id: ing.id,
          quantity: ing.quantity,
          unitId: ing.unitId,
          name: ing.name || '',
          unit: ing.unit || ''
        })) || [],
        faq: initialRecipe.faq || [],
        instructions: initialRecipe.instructions || [{ step: 1, description: "", imageURL: undefined }],
        nutrition: initialRecipe.nutrition || {
          calories: 0,
          carbohydrates: 0,
          fat: 0,
          protein: 0,
          salt: 0,
        }
      };
      setFormData(formattedRecipe);
    }
  }, [initialRecipe]);

  const updateFormData = useCallback((updates: Partial<RecipeFormData>) => {
    setFormData(prev => ({
      ...prev,
      ...updates
    }));
  }, []);

  const resetFormData = useCallback(() => {
    setFormData({
      name: "",
      genre: { id: 1, name: "和食" },
      cookingTime: 0,
      costEstimate: 0,
      summary: "",
      catchphrase: "",
      nutrition: {
        calories: 0,
        carbohydrates: 0,
        fat: 0,
        protein: 0,
        salt: 0,
      },
      ingredients: [],
      instructions: [{ step: 1, description: "", imageURL: undefined }],
      image: undefined,
      imageUrl: undefined,
      isPublic: true,
      isDraft: false,
      faq: [{ question: "", answer: "" }],
    });
  }, []);

  const handleSubmit = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!user?.id) {
        throw new Error("ユーザーIDが見つかりません。ログインしてください。");
      }

      validateRecipe(formData);

      const recipeToSubmit = {
        ...formData,
        isDraft: false,
        ingredients: formData.ingredients.map(ing => {
          const selectedUnit = units?.find(u => u.name === ing.unit);
          return {
            ...ing,
            unitId: selectedUnit?.id || ing.unitId
          };
        })
      };

      const formDataToSubmit = createFormData(recipeToSubmit, user.id, isAdmin, false);

      if (initialRecipe?.id) {
        await updateRecipeMutation.mutateAsync({
          id: initialRecipe.id,
          formData: formDataToSubmit,
        });
        if (isAdmin) {
          router.push("/admin/recipes/");
        } else {
          router.push("/user/recipes/");
        }
      } else {
        await addRecipeMutation.mutateAsync({
          formData: formDataToSubmit,
          userId: user.id,
          isPublic: formData.isPublic,
        });
        if (isAdmin) {
          router.push("/admin/recipes/");
        } else {
          router.push("/user/recipes/");
        }
      }

      if (!initialRecipe?.id) {
        resetFormData();
      }
      toast.success(VALIDATION_MESSAGES.SUCCESS);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      console.error(VALIDATION_MESSAGES.ERROR, error);
      toast.error(error instanceof Error ? error.message : VALIDATION_MESSAGES.ERROR);
    } finally {
      setIsLoading(false);
    }
  }, [formData, user?.id, isAdmin, initialRecipe, addRecipeMutation, updateRecipeMutation, resetFormData, router]);

  const handleSaveDraft = useCallback(async () => {
    try {
      setSaveStatus("saving");
      validateDraft(formData);

      if (!user?.id) {
        throw new Error("ユーザーIDが見つかりません。ログインしてください。");
      }

      const draftRecipe = {
        ...formData,
        isDraft: true,
      };

      const formDataToSubmit = createFormData(draftRecipe, user.id, isAdmin, false);
      formDataToSubmit.append("is_draft", "true");

      if (initialRecipe?.id) {
        await updateRecipeMutation.mutateAsync({
          id: initialRecipe.id,
          formData: formDataToSubmit,
        });
      } else {
        await addRecipeMutation.mutateAsync({
          formData: formDataToSubmit,
          userId: user.id,
          isPublic: false,
          isDraft: true,
        });
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
      toast.success(VALIDATION_MESSAGES.DRAFT_SAVED);
    } catch (error) {
      console.error("Failed to save draft:", error);
      toast.error(error instanceof Error ? error.message : VALIDATION_MESSAGES.DRAFT_SAVE_ERROR);
      setSaveStatus("idle");
    }
  }, [formData, user?.id, isAdmin, initialRecipe, addRecipeMutation, updateRecipeMutation]);

  return {
    formData,
    updateFormData,
    resetFormData,
    handleSubmit,
    handleSaveDraft,
    isLoading,
    saveStatus,
  };
}; 