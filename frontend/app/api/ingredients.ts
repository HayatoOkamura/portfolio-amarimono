import { api } from "../utils/api";

export const createIngredient = async (formData: FormData) => {
  try {
    const response = await api.post("/admin/ingredients", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error("Error creating ingredient:", error);
    return { success: false, error: "Failed to create ingredient" };
  }
};

// ユーザーの初期設定具材を取得
export const getUserIngredientDefaults = async () => {
  const response = await api.get("/api/user/ingredient-defaults");
  return response.data;
};

// ユーザーの初期設定具材を更新
export const updateUserIngredientDefault = async (data: {
  ingredient_id: number;
  default_quantity: number;
}[]) => {
  const response = await api.put("/api/user/ingredient-defaults", data);
  return response.data;
};

// カテゴリ別の具材を取得
export const getIngredientsByCategory = async (category: string) => {
  const response = await api.get(`/api/ingredients/by-category?category=${encodeURIComponent(category)}`);
  return response.data;
};
