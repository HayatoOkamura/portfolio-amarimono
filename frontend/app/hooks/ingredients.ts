/* eslint-disable */
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import { Genre, Ingredient, Unit, NewIngredient, EditIngredient } from "../types";

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
    unit: {
      id: ingredient.unit.id,
      name: ingredient.unit.name,
      description: ingredient.unit.description,
      step: ingredient.unit.step
    }
  }));
};

export const addIngredientService = async (
  name: string,
  imageUrl: File,
  genre: Genre,
  unit: Unit
): Promise<Ingredient> => {
  const formData = new FormData();

  formData.append("name", name);
  formData.append("image", imageUrl);
  formData.append("genre", JSON.stringify(genre));
  formData.append("unit", JSON.stringify(unit));

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
    unit: ingredient.unit ? {
      id: ingredient.unit.id || 0,
      name: ingredient.unit.name || "Unknown",
      abbreviation: ingredient.unit.abbreviation || "",
    } : { id: 0, name: "Unknown", abbreviation: "" }
  };
};

export const deleteIngredientService = async (id: number): Promise<void> => {
  const res = await fetch(`${backendUrl}/admin/ingredients/${id}`, {
    method: "DELETE",
  });
  await handleApiResponse(res);
};

export const updateIngredientService = async (
  id: number,
  updatedData: EditIngredient
): Promise<Ingredient> => {
  try {
    const formData = new FormData();
    formData.append("name", updatedData.name);
    formData.append("image", updatedData.imageUrl);
    formData.append("genre", JSON.stringify(updatedData.genre));
    formData.append("unit", JSON.stringify(updatedData.unit));

    console.log("FormData entries:");
    for (const [key, value] of formData.entries()) {
      console.log(`${key}:`, value);
    }

    const res = await fetch(`${backendUrl}/admin/ingredients/${id}`, {
      method: "PATCH",
      body: formData,
    });

    console.log("レスポンス:", res);

    if (!res.ok) {
      const errorResponse = await res.json();  // エラー時のレスポンス内容を取得
      console.error("エラーレスポンス:", errorResponse);
      throw new Error(`Failed to update ingredient: ${errorResponse.message || res.statusText}`);
    }

    const ingredient = await res.json();

    return {
      ...ingredient,
      imageUrl: ingredient.image_url || "",
      genreId: ingredient.genre_id || null,
      genre: ingredient.genre
        ? { id: ingredient.genre.id || 0, name: ingredient.genre.name || "Unknown" }
        : { id: 0, name: "Unknown" },
      unit: ingredient.unit
        ? { id: ingredient.unit.id || 0, name: ingredient.unit.name || "Unknown", abbreviation: ingredient.unit.abbreviation || "" }
        : { id: 0, name: "Unknown", abbreviation: "" },
    };
  } catch (error) {
    console.error("Error updating ingredient:", error);
    throw error; // エラーを再スロー
  }
};

