/* eslint-disable */
"use client";

import { useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import useIngredientStore from "@/app/stores/ingredientStore";
import useGenreStore from "@/app/stores/genreStore";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";
import { useIngredients } from "@/app/hooks/ingredients";
import {
  useUserRecipes,
  useDeleteRecipe,
  useUpdateRecipe,
} from "@/app/hooks/recipes";
import { imageBaseUrl } from "@/app/utils/api";
import Image from "next/image";
import { useState } from "react";
import { Ingredient, Instruction, Recipe } from "@/app/types/index";
import styles from "./new.module.scss";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import { useRouter } from "next/navigation";
import { withAuth } from "@/app/components/auth/withAuth";

const RecipeRegistrationContent = () => {
  const { user } = useAuth();
  const { setIngredients } = useIngredientStore();
  const { fetchRecipeGenres, recipeGenres } = useGenreStore();
  const { data: ingredientsData } = useIngredients();
  const { data: recipesData, isLoading } = useUserRecipes(user?.id);
  const deleteRecipeMutation = useDeleteRecipe();
  const updateRecipeMutation = useUpdateRecipe();
  const [editingRecipe, setEditingRecipe] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    if (ingredientsData) {
      setIngredients(ingredientsData);
    }
    fetchRecipeGenres();
  }, [ingredientsData, setIngredients, fetchRecipeGenres]);

  const closeEditModal = () => {
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const handleChange = (field: string, value: any) => {
    setEditingRecipe((prev: any) => ({ ...prev, [field]: value }));
  };

  const saveEditedRecipe = async () => {
    if (editingRecipe) {
      const formData = new FormData();
      formData.append("name", editingRecipe.name);
      formData.append("cookingTime", editingRecipe.cookingTime.toString());
      formData.append("costEstimate", editingRecipe.costEstimate);
      formData.append("summary", editingRecipe.summary);
      formData.append("catchphrase", editingRecipe.catchphrase);
      formData.append("nutrition", JSON.stringify(editingRecipe.nutrition));
      formData.append("faq", JSON.stringify(editingRecipe.faq));
      formData.append("genre_id", editingRecipe.genre.id.toString());
      formData.append("ingredients", JSON.stringify(editingRecipe.ingredients));
      formData.append(
        "instructions",
        JSON.stringify(editingRecipe.instructions)
      );

      if (editingRecipe.imageUrl instanceof File) {
        formData.append("image", editingRecipe.imageUrl);
      }

      try {
        await updateRecipeMutation.mutateAsync({
          id: editingRecipe.id,
          formData,
        });
        closeEditModal();
      } catch (err: any) {
        console.error(err.message);
      }
    }
  };

  return (
    <div className={styles.container}>
      <RegistrationForm />

      {isModalOpen && editingRecipe && (
        <div className={styles.modal_block}>
          <div className="bg-white p-6 rounded-lg w-96 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Edit Recipe</h2>
            <input
              type="text"
              value={editingRecipe.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="border p-2 w-full mb-2 rounded"
            />
            <select
              value={editingRecipe.genre?.id || ""}
              onChange={(e) =>
                handleChange(
                  "genre",
                  recipeGenres.find((g) => g.id === parseInt(e.target.value))
                )
              }
              className="border p-2 w-full mb-2 rounded"
            >
              {recipeGenres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>
            {editingRecipe.instructions.map(
              (instruction: Instruction, index: number) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <span className="font-bold">Step {index + 1}:</span>
                  <input
                    type="text"
                    value={instruction.description}
                    onChange={(e) => {
                      const updatedInstructions =
                        editingRecipe.instructions.map((instr: Instruction) =>
                          instr.id === instruction.id
                            ? { ...instr, description: e.target.value }
                            : instr
                        );
                      setEditingRecipe({
                        ...editingRecipe,
                        instructions: updatedInstructions,
                      });
                    }}
                    className="border p-2 rounded flex-grow"
                  />
                  <button
                    className="bg-red-500 text-white px-2 py-1 rounded"
                    onClick={() => {
                      const filteredInstructions = editingRecipe.instructions
                        .filter(
                          (instr: Instruction) =>
                            Number(instr.stepNumber) !==
                            Number(instruction.stepNumber)
                        )
                        .map((instr: Instruction, i: number) => ({
                          ...instr,
                          stepNumber: i + 1,
                        }));

                      setEditingRecipe({
                        ...editingRecipe,
                        instructions: filteredInstructions,
                      });
                    }}
                  >
                    Delete
                  </button>
                </div>
              )
            )}
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full mb-2"
              onClick={() =>
                setEditingRecipe({
                  ...editingRecipe,
                  instructions: [
                    ...editingRecipe.instructions,
                    {
                      id: editingRecipe.instructions.length + 1,
                      stepNumber: editingRecipe.instructions.length + 1,
                      description: "",
                    },
                  ],
                })
              }
            >
              Add Step
            </button>
            <button
              className="bg-green-500 text-white px-4 py-2 rounded w-full"
              onClick={saveEditedRecipe}
            >
              Save
            </button>
            <button
              className="bg-gray-400 text-white px-4 py-2 rounded w-full mt-2"
              onClick={closeEditModal}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const RecipeRegistration = () => {
  return <RecipeRegistrationContent />;
}

export default withAuth(RecipeRegistration);
