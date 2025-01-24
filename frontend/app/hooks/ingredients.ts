/* eslint-disable */
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import { Genre, Ingredient } from "../types";

export const fetchIngredientsService = async (): Promise<Ingredient[]> => {
  const res = await fetch(`${backendUrl}/admin/ingredients`);
  const data = await handleApiResponse(res);
  return data.map((ingredient: any) => ({
    ...ingredient,
    imageUrl: ingredient.image_url,
    genre: {
      id: ingredient.genre.id,
      name: ingredient.genre.name,
    },
  }));
};

export const addIngredientService = async (
  name: string,
  imageUrl: File,
  genre: Genre // 修正: GenreのIDを受け取る
): Promise<Ingredient> => {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("image", imageUrl);
  formData.append("genre", JSON.stringify(genre));
  
  
  const res = await fetch(`${backendUrl}/admin/ingredients`, {
    method: "POST",
    body: formData,
  });
  const ingredient = await res.json();
  
  
  return {
    ...ingredient,
    imageUrl: ingredient.image_url || "", // imageUrlが存在しない場合のデフォルト
    genre: ingredient.genre
      ? { id: ingredient.genre.id || 0, name: ingredient.genre.name || "Unknown" } // genreが存在しない場合のデフォルト値
      : { id: 0, name: "Unknown" },
  };
};

// Ingredientを削除
export const deleteIngredientService = async (id: number): Promise<void> => {
  const res = await fetch(`${backendUrl}/admin/ingredients/${id}`, {
    method: "DELETE",
  });
  await handleApiResponse(res);
};
