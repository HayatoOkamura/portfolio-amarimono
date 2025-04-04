/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ingredient, Genre, Unit, NewIngredient, EditIngredient } from "../types/index";
import { api } from "../utils/api";
import useIngredientStore from "../stores/ingredientStore";

// Query keys
const ingredientKeys = {
  all: ["ingredients"] as const,
  lists: () => [...ingredientKeys.all, "list"] as const,
  list: (filters: string) => [...ingredientKeys.lists(), { filters }] as const,
  details: () => [...ingredientKeys.all, "detail"] as const,
  detail: (id: number) => [...ingredientKeys.details(), id] as const,
};

// 共通の食材データ変換関数
const mapIngredient = (ingredient: any): Ingredient => {
  if (!ingredient) {
    throw new Error("Ingredient data is null or undefined");
  }

  return {
    id: ingredient.id || 0,
    name: ingredient.name || "",
    genre: ingredient.genre || { id: 0, name: "" },
    unit: ingredient.unit || { id: 0, name: "", step: 1 },
    imageUrl: ingredient.image_url || null,
    quantity: ingredient.quantity || 0,
  };
};

// 配列対応の関数
const mapIngredients = (ingredients: any[]): Ingredient[] => ingredients.map(mapIngredient);

// Service functions
const fetchIngredientsService = async (): Promise<Ingredient[]> => {
  const response = await api.get("/admin/ingredients");
  return mapIngredients(response.data);
};

const addIngredientService = async (data: {
  name: string;
  imageUrl: File;
  genre: Genre;
  unit: Unit;
}): Promise<Ingredient> => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("imageUrl", data.imageUrl);
  formData.append("genre", JSON.stringify(data.genre));
  formData.append("unit", JSON.stringify(data.unit));

  const response = await api.post("/ingredients", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

const deleteIngredientService = async (id: number): Promise<void> => {
  await api.delete(`/ingredients/${id}`);
};

const updateIngredientService = async ({
  id,
  data,
}: {
  id: number;
  data: EditIngredient;
}): Promise<Ingredient> => {
  const formData = new FormData();
  if (data.name) formData.append("name", data.name);
  if (data.imageUrl) formData.append("imageUrl", data.imageUrl);
  if (data.genre) formData.append("genre", JSON.stringify(data.genre));
  if (data.unit) formData.append("unit", JSON.stringify(data.unit));

  const response = await api.patch(`/ingredients/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

// Query hooks
export const useIngredients = () => {
  return useQuery({
    queryKey: ingredientKeys.lists(),
    queryFn: fetchIngredientsService,
  });
};

// Mutation hooks
export const useAddIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addIngredientService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
};

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteIngredientService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
};

export const useUpdateIngredient = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateIngredientService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
    },
  });
};

export const useUpdateIngredientQuantity = () => {
  const updateQuantity = useIngredientStore((state) => state.updateQuantity);
  const { refetch } = useIngredients();
  const ingredients = useIngredientStore((state) => state.ingredients);

  return useMutation({
    mutationFn: async (ingredient: Ingredient) => {
      if (ingredients.length === 0) {
        await refetch();
      }
      updateQuantity(ingredient.id, ingredient.quantity);
      return ingredient;
    },
  });
};

