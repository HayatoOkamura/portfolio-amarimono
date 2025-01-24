/* eslint-disable */
import { handleApiResponse } from "../utils/apiUtils";

export async function fetchRecipesAPI(ingredients: { id: number; quantity: number }[]) {
  // 具材が空の場合はリクエストを送信しない
  if (ingredients.length === 0) {
    throw new Error("具材が選択されていません");
  }

  // 送信前にフィールド名を変換
  const transformedIngredients = ingredients.map(({ id, quantity }) => ({
    ingredient_id: id,
    quantity_required: quantity
  }));


  const response = await fetch("/api/recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transformedIngredients),
  });
  
  const responseData = await handleApiResponse(response);
  

  return Array.isArray(responseData)
  ? responseData.map((data: any) => ({
      id: data.recipe.id,
      name: data.recipe.name,
      instructions: data.recipe.instructions.map((step: any) => ({
        stepNumber: step.stepNumber,
        description: step.description,
      })),
      genre: data.recipe.genre,
      imageUrl: data.recipe.image_url,
      ingredients: data.ingredients.map((ingredient: any) => ({
        id: ingredient.id,
        name: ingredient.name,
        quantity: ingredient.quantity,
      })),
    }))
  : [];
}
