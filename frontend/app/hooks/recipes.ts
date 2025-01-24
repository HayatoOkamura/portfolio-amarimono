/* eslint-disable */
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import { Recipe } from "../types";

export const fetchRecipesService = async (): Promise<Recipe[]> => {
  const res = await fetch(`${backendUrl}/admin/recipes`);
  const data = await handleApiResponse(res);
  
  return data.map((recipe: any) => ({
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions.map((step: any) => ({
      stepNumber: step.stepNumber,
      description: step.description,
    })),
    genre: recipe.genre,
    imageUrl: recipe.image_url,
    ingredients: recipe.ingredients.map((ingredient: any) => ({
      id: ingredient.ingredient_id,
      quantity: ingredient.quantity_required,
    })),
  }));
};

export const addRecipeService = async (formData: FormData): Promise<Recipe> => {
  
  const res = await fetch(`${backendUrl}/admin/recipes`, {
    method: "POST",
    body: formData,
  });
  
  return handleApiResponse(res);
};

export const deleteRecipeService = async (id: number): Promise<void> => {
  const res = await fetch(`${backendUrl}/admin/recipes/${id}`, {
    method: "DELETE",
  });
  await handleApiResponse(res);
};
