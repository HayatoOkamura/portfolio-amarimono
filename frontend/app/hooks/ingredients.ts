/* eslint-disable */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ingredient, Genre, Unit, NewIngredient, EditIngredient } from "../types/index";
import { api } from "../utils/api";
import useIngredientStore from "../stores/ingredientStore";
import axios from "axios";
import { getUserIngredientDefaults, updateUserIngredientDefault, getIngredientsByCategory } from '../api/ingredients';

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
    nutrition: ingredientData.nutrition || {
      calories: 0,
      carbohydrates: 0,
      fat: 0,
      protein: 0,
      salt: 0
    }
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
  try {
    const formData = new FormData();
    if (data.name) formData.append("name", data.name);
    if (data.genre) formData.append("genre", JSON.stringify({ id: data.genre.id }));
    if (data.unit) formData.append("unit", JSON.stringify({ 
      id: data.unit.id,
      step: data.unit.step 
    }));
    if (data.nutrition) formData.append("nutrition", JSON.stringify(data.nutrition));
    
    // 画像の処理
    if (data.imageUrl instanceof File) {
      formData.append("image", data.imageUrl);
    } else if (typeof data.imageUrl === "string") {
      formData.append("image_url", data.imageUrl);
    }

    console.log('Updating ingredient with ID:', id);
    console.log('Request URL:', `/admin/ingredients/${id}`);
    console.log('FormData contents:', Object.fromEntries(formData.entries()));

    const response = await api.patch(`/admin/ingredients/${id}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return mapIngredient(response.data);
  } catch (error) {
    console.error('Error updating ingredient:', error);
    if (axios.isAxiosError(error)) {
      console.error('Request URL:', error.config?.url);
      console.error('Request method:', error.config?.method);
      console.error('Request headers:', error.config?.headers);
      console.error('Response status:', error.response?.status);
      console.error('Response data:', error.response?.data);
    }
    throw error;
  }
};

// Query hooks
export const useIngredients = (options?: {
  initialData?: Ingredient[];
  staleTime?: number;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}) => {
  return useQuery({
    queryKey: ingredientKeys.lists(),
    queryFn: fetchIngredientsService,
    ...options
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

// サーバーサイド用のデータフェッチ関数
export const fetchIngredientsServer = async (): Promise<Ingredient[]> => {
  // Docker環境ではbackendサービスに直接接続
  const baseURL = process.env.NODE_ENV === 'development' 
    ? 'http://backend:8080'  // Docker環境用
    : process.env.NEXT_PUBLIC_BACKEND_URL || 'https://amarimono-backend.onrender.com';

  const response = await axios.create({ baseURL }).get("/admin/ingredients");
  const mappedIngredients = mapIngredients(response.data);
  return mappedIngredients;
};

// ユーザーの初期設定具材を取得するフック
export const useUserIngredientDefaults = () => {
  return useQuery({
    queryKey: ['userIngredientDefaults'],
    queryFn: getUserIngredientDefaults,
  });
};

// ユーザーの初期設定具材を更新するフック
export const useUpdateUserIngredientDefault = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateUserIngredientDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userIngredientDefaults'] });
    },
  });
};

// カテゴリ別の具材を取得するフック
export const useIngredientsByCategory = (categoryId: number) => {
  return useQuery<Ingredient[]>({
    queryKey: ['ingredients', categoryId],
    queryFn: async () => {
      // カテゴリIDが0（すべて）の場合は、すべての具材を取得
      if (categoryId === 0) {
        const response = await api.get<any[]>('/admin/ingredients');
        return mapIngredients(response.data);
      }
      // それ以外の場合は、カテゴリ別の具材を取得
      const response = await api.get<any[]>(`/api/ingredients/by-category?category_id=${categoryId}`);
      return mapIngredients(response.data);
    },
  });
};

