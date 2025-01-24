import { backendUrl, handleApiResponse } from "../utils/apiUtils";

// レシピのジャンルを取得
export const fetchRecipeGenres = async () => {
  const res = await fetch(`${backendUrl}/api/recipe_genres`);
  return handleApiResponse(res);
};

// 食材のジャンルを取得
export const fetchIngredientGenres = async () => {
  const res = await fetch(`${backendUrl}/api/ingredient_genres`);
  return handleApiResponse(res);
};