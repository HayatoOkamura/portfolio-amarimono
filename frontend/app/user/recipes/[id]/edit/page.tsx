/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { RecipeFormData } from "@/app/components/features/RecipeForm/types/recipeForm";
import { imageBaseUrl } from "@/app/utils/api";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";
import { useRouter } from "next/navigation";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { withAuth } from "@/app/components/auth/withAuth";

const UserRecipeEdit = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<RecipeFormData | null>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").slice(-2)[0];
    if (id) {
      fetchRecipeByIdService(id)
        .then((recipeData) => {
          const newRecipe: RecipeFormData = {
            id: recipeData.id,
            name: recipeData.name,
            genre: recipeData.genre || { id: 1, name: "すべて" },
            cookingTime: recipeData.cookingTime,
            costEstimate: recipeData.costEstimate,
            summary: recipeData.summary,
            catchphrase: recipeData.catchphrase,
            nutrition: {
              calories: recipeData.nutrition?.calories || 0,
              carbohydrates: recipeData.nutrition?.carbohydrates || 0,
              fat: recipeData.nutrition?.fat || 0,
              protein: recipeData.nutrition?.protein || 0,
              salt: recipeData.nutrition?.salt || 0
            },
            instructions: recipeData.instructions.map(step => ({
              step: step.stepNumber,
              description: step.description,
              imageURL: step.imageUrl ? `${imageBaseUrl}/${step.imageUrl}` : undefined
            })),
            ingredients: recipeData.ingredients.map(ing => ({
              id: ing.id,
              quantity: ing.quantity,
              unitId: ing.unit.id,
              name: ing.name,
              unit: ing.unit.name
            })),
            image: undefined,
            imageUrl: recipeData.imageUrl,
            isPublic: recipeData.isPublic || false,
            isDraft: recipeData.isDraft || false,
            faq: recipeData.faq || []
          };
          setRecipe(newRecipe);
        })
        .catch((error) => console.error("Error fetching recipe:", error));
    }
  }, []);

  return (
    <PageLoading isLoading={!recipe}>
      {recipe && (
        <div className="">
          <RegistrationForm isAdmin={false} initialRecipe={recipe} />
        </div>
      )}
    </PageLoading>
  );
};

const UserRecipeEditWithAuth = () => {
  return <UserRecipeEdit />;
};

export default withAuth(UserRecipeEditWithAuth); 