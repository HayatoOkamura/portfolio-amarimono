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
