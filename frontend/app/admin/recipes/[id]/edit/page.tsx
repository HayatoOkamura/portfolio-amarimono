/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import { Recipe, NewRecipe } from "@/app/types/index";
import { backendUrl } from "@/app/utils/apiUtils";
import { fetchRecipeByIdService } from "@/app/hooks/recipes";
import { RegistrationForm } from "@/app/components/features/RecipeForm/RegistrationForm";
import { useRouter } from "next/navigation";

const AdminRecipeEdit = () => {
  const router = useRouter();
  const [recipe, setRecipe] = useState<NewRecipe | null>(null);

  useEffect(() => {
    const id = window.location.pathname.split("/").slice(-2)[0];
    if (id) {
      fetchRecipeByIdService(id)
        .then((recipeData) => {
          const newRecipe: NewRecipe = {
            id: recipeData.id,
            name: recipeData.name,
            genre: recipeData.genre || { id: 1, name: "すべて" },
            cookingTime: recipeData.cookingTime,
            costEstimate: recipeData.costEstimate,
            summary: recipeData.summary,
            catchphrase: recipeData.catchphrase,
            nutrition: recipeData.nutrition || {
              calories: 0,
              carbohydrates: 0,
              fat: 0,
              protein: 0,
              sugar: 0,
              salt: 0
            },
            instructions: recipeData.instructions.map(step => ({
              step: step.stepNumber,
              description: step.description,
              imageURL: step.imageUrl ? `${backendUrl}/uploads/${step.imageUrl}` : undefined
            })),
            ingredients: recipeData.ingredients.map(ing => ({
              id: ing.id,
              quantity: ing.quantity,
              unitId: ing.unit.id
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

  if (!recipe) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Edit Recipe</h2>
        <button
          onClick={() => router.back()}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancel
        </button>
      </div>

      <RegistrationForm isAdmin={true} initialRecipe={recipe} />
    </div>
  );
};

export default AdminRecipeEdit; 