import { backendUrl, handleApiResponse } from "../utils/api";

// レシピのジャンルを取得
export const fetchRecipeGenres = async () => {
  const res = await fetch(`${backendUrl}/api/recipe_genres`);
  return handleApiResponse(res);
};

// 食材のジャンルを取得
export const fetchIngredientGenres = async () => {
  const res = await fetch(`${backendUrl}/api/ingredient_genres`);
  const data = await handleApiResponse(res);
  return data;
};