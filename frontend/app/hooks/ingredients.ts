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
  
  // レスポンスがネストされた形式の場合、ingredientプロパティを使用
  const ingredientData = ingredient.ingredient || ingredient;
  
  const mapped = {
    id: ingredientData.id || 0,
    name: ingredientData.name || "",
    genre: {
      id: ingredientData.genre?.id || ingredientData.genre_id || 0,
      name: ingredientData.genre?.name || ""
    },
    unit: ingredientData.unit || { id: 0, name: "", step: 1 },
    imageUrl: ingredientData.image_url || "/pic_recipe_default.webp",
    quantity: ingredientData.quantity || 0,
  };
  return mapped;
};

// 配列対応の関数
const mapIngredients = (ingredients: any[]): Ingredient[] => {
  return ingredients.map(ing => {
    const mapped = mapIngredient(ing);
    return mapped;
  });
};

// Service functions
const fetchIngredientsService = async (): Promise<Ingredient[]> => {
  const response = await api.get("/admin/ingredients");
  const mappedIngredients = mapIngredients(response.data);
  return mappedIngredients;
};

const addIngredientService = async (formData: FormData): Promise<Ingredient> => {
  try {
    const response = await api.post("/admin/ingredients", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      transformRequest: [(data) => data],
    });

    return mapIngredient(response.data);
  } catch (error: any) {
    console.error("Error in addIngredientService:", error);
    if (error.response) {
      console.error("Error response data:", error.response.data);
      console.error("Error response status:", error.response.status);
      console.error("Error response headers:", error.response.headers);
    }
    throw error;
  }
};

const deleteIngredientService = async (id: number): Promise<void> => {
  await api.delete(`/admin/ingredients/${id}`);
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
  const addIngredient = useIngredientStore((state) => state.addIngredient);
  const setIngredients = useIngredientStore((state) => state.setIngredients);

  return useMutation({
    mutationFn: addIngredientService,
    onSuccess: (data) => {
      // ローカルストアの状態を更新
      addIngredient(data);
      
      // キャッシュを無効化して再取得をトリガー
      queryClient.invalidateQueries({ queryKey: ingredientKeys.lists() });
      
      // ストアの状態を更新
      const ingredients = queryClient.getQueryData<Ingredient[]>(ingredientKeys.lists());
      if (ingredients) {
        setIngredients(ingredients);
      }
    },
  });
};

export const useDeleteIngredient = () => {
  const queryClient = useQueryClient();
  const deleteIngredient = useIngredientStore((state) => state.deleteIngredient);

  return useMutation({
    mutationFn: deleteIngredientService,
    onSuccess: (_, id) => {
      deleteIngredient(id);
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

