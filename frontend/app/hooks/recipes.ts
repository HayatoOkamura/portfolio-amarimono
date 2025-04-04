/* eslint-disable */
"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Recipe, Instruction, Ingredient, Review } from "../types/index";
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import useRecipeStore from "@/app/stores/recipeStore";
import { sortRecipes } from "@/app/utils/sortRecipes";
import { api } from "@/app/utils/api";

interface ApiInstruction {
  stepNumber: number;
  description: string;
  image_url: string | null;
}

interface ApiIngredient {
  ingredient_id: number;
  ingredient: {
    name: string;
    unit: {
      id: number;
      name: string;
      description: string;
      step: number;
    } | null;
  };
  quantity_required: number;
}

interface ApiReview {
  id: string;
  rating: number;
  comment: string;
  create_at: string;
  updated_at: string;
  userId: string;
}

interface ApiRecipe {
  id: string;
  name: string;
  instructions: ApiInstruction[];
  genre: {
    id: number;
    name: string;
  };
  image_url: string | null;
  ingredients: ApiIngredient[];
  cooking_time: number;
  reviews: ApiReview[];
  cost_estimate: number;
  summary: string;
  catchphrase: string;
  nutrition: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    sugar: number;
    salt: number;
  } | null;
  nutrition_percentage: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
    sugar: number;
    salt: number;
  } | null;
  faq: { question: string; answer: string }[];
  is_draft: boolean;
  is_public: boolean;
}

// Query keys
export const recipeKeys = {
  all: ["recipes"] as const,
  lists: () => [...recipeKeys.all, "list"] as const,
  list: (filters: string) => [...recipeKeys.lists(), { filters }] as const,
  details: () => [...recipeKeys.all, "detail"] as const,
  detail: (id: string) => [...recipeKeys.details(), id] as const,
  recommended: (userId: string) => [...recipeKeys.all, "recommended", userId] as const,
  userRecipes: (userId: string) => [...recipeKeys.all, "user", userId] as const,
  favorites: (userId: string) => [...recipeKeys.all, "favorites", userId] as const,
};

// 共通のレシピデータ変換関数
export const mapRecipe = (recipe: ApiRecipe): Recipe => {
  if (!recipe) {
    throw new Error("Recipe data is null or undefined");
  }

  const defaultNutrition = {
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    protein: 0,
    sugar: 0,
    salt: 0,
  };

  return {
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions.map((step) => ({
      id: step.stepNumber.toString(),
      stepNumber: step.stepNumber,
      description: step.description,
      imageUrl: step.image_url || undefined,
    })),
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: {
        id: ingredient.ingredient.unit?.id || 0,
        name: ingredient.ingredient.unit?.name || "",
        description: ingredient.ingredient.unit?.description || "",
        step: ingredient.ingredient.unit?.step || 1
      },
      genre: { id: 0, name: "すべて" },
      imageUrl: null,
    })),
    genre: recipe.genre,
    imageUrl: recipe.image_url || undefined,
    cookingTime: recipe.cooking_time,
    reviews: recipe.reviews.map((review) => ({
      id: review.id,
      recipeId: recipe.id,
      userId: review.userId || "",
      rating: review.rating,
      comment: review.comment,
      createdAt: review.create_at,
      updatedAt: review.updated_at,
    })),
    costEstimate: recipe.cost_estimate,
    summary: recipe.summary,
    catchphrase: recipe.catchphrase,
    nutrition: recipe.nutrition || defaultNutrition,
    nutritionPercentage: recipe.nutrition_percentage || null,
    faq: recipe.faq || [],
    isDraft: recipe.is_draft || false,
    isPublic: recipe.is_public || false,
  };
};

// 配列対応の関数
export const mapRecipes = (data: ApiRecipe[]): Recipe[] => {
  const defaultNutrition = {
    calories: 0,
    carbohydrates: 0,
    fat: 0,
    protein: 0,
    sugar: 0,
    salt: 0,
  };

  return data.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    imageUrl: recipe.image_url || undefined,
    instructions: (recipe.instructions || []).map((instruction) => ({
      id: instruction.stepNumber.toString(),
      stepNumber: instruction.stepNumber,
      description: instruction.description,
      imageUrl: instruction.image_url || undefined,
    })),
    genre: recipe.genre,
    ingredients: (recipe.ingredients || []).map((ingredient) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: {
        id: ingredient.ingredient.unit?.id || 0,
        name: ingredient.ingredient.unit?.name || "",
        description: ingredient.ingredient.unit?.description || "",
        step: ingredient.ingredient.unit?.step || 1
      },
      genre: {
        id: 0,
        name: ''
      },
      imageUrl: null
    })),
    cookingTime: recipe.cooking_time,
    reviews: (recipe.reviews || []).map((review) => ({
      id: review.id,
      recipeId: recipe.id,
      userId: review.userId || "",
      rating: review.rating,
      comment: review.comment,
      createdAt: review.create_at,
      updatedAt: review.updated_at,
    })),
    costEstimate: recipe.cost_estimate,
    summary: recipe.summary,
    catchphrase: recipe.catchphrase,
    nutrition: recipe.nutrition || defaultNutrition,
    nutritionPercentage: recipe.nutrition_percentage || null,
    faq: recipe.faq || [],
    isDraft: recipe.is_draft || false,
    isPublic: recipe.is_public || false
  }));
};

// Service functions

// レシピ一覧取得（管理画面用）
export const fetchRecipesService = async (): Promise<Recipe[]> => {
  const response = await api.get("/admin/recipes");
  return mapRecipes(response.data);
};

// 具材からレシピを検索
export const fetchRecipesAPI = async (ingredients: { id: number; quantity: number }[]) => {
  if (ingredients.length === 0) {
    throw new Error("具材が選択されていません");
  }

  const transformedIngredients = ingredients.map(({ id, quantity }) => ({
    ingredientId: id,
    quantityRequired: quantity
  }));

  await new Promise(resolve => setTimeout(resolve, 500))

  const response = await api.post("/api/recipes", transformedIngredients);

  return Array.isArray(response.data) ? mapRecipes(response.data) : [];
};

// レシピ名で検索
export const fetchSearchRecipes = async (query: string): Promise<Recipe[]> => {
  const response = await api.get(`/api/recipes/search?q=${encodeURIComponent(query)}`);
  try {
    const mappedRecipes = mapRecipes(response.data);
    return mappedRecipes;
  } catch (error) {
    return [];
  }
};

// レシピIDで詳細を取得
export const fetchRecipeByIdService = async (id: string) => {
  console.log('Fetching recipe with ID:', id);
  try {
    const response = await api.get(`/api/recipes/${id}`);
    console.log('API Response:', response.data);
    return mapRecipe(response.data.recipe);
  } catch (error: any) {
    console.error('Error in fetchRecipeByIdService:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

// 新規レシピの登録
export const addRecipeService = async (formData: FormData): Promise<Recipe> => {
  try {
    const response = await api.post("/admin/recipes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.recipe;
  } catch (error) {
    throw error;
  }
};

// レシピの削除
export const deleteRecipeService = async (id: string): Promise<void> => {
  await api.delete(`/admin/recipes/${id}`);
};

// レシピの更新
export const updateRecipeService = async (
  id: string,
  updatedData: FormData
): Promise<Recipe> => {
  try {
    const ingredientsRaw = updatedData.get("ingredients") as string;
    if (ingredientsRaw) {
      const ingredients = JSON.parse(ingredientsRaw);
      // 配列であることを確認し、必要なプロパティが存在することを確認
      if (Array.isArray(ingredients)) {
        const formattedIngredients = ingredients
          .filter(ing => ing && typeof ing === 'object')
          .map((ing: any) => ({
            ingredient_id: ing.id,
            quantity_required: ing.quantity,
            unit_id: ing.unit?.id || 1
          }));

        // 具材データが空でないことを確認
        if (formattedIngredients.length === 0) {
          throw new Error("具材を選択してください");
        }

        updatedData.delete("ingredients");
        updatedData.append("ingredients", JSON.stringify(formattedIngredients));
      } else {
        throw new Error("Invalid ingredients data format");
      }
    }

    const response = await api.put(`/admin/recipes/${id}`, updatedData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error in updateRecipeService:", error);
    throw error;
  }
};

// いいね機能の内部実装
export const handleLikeService = async (
  userId: string,
  recipeId: string,
  setIsLiked: React.Dispatch<React.SetStateAction<boolean>>,
  setShowLoginModal: React.Dispatch<React.SetStateAction<boolean>>
) => {
  if (!userId) {
    setShowLoginModal(true);
    return;
  }

  try {
    const response = await fetch(`${backendUrl}/api/likes/${userId}/${recipeId}`, {
      method: "POST",
    });

    if (response.ok) {
      const data = await response.json();
      setIsLiked((prev) => !prev);
      alert(data.message);
    } else {
      console.error("Failed to toggle like");
    }
  } catch (error) {
    console.error("Error toggling like", error);
  }
};

// ユーザーのレシピ一覧を取得
const fetchUserRecipes = async (userId: string) => {
  const res = await fetch(`${backendUrl}/api/user/recipes?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user recipes");
  }

  const data = await res.json();
  return { recipes: mapRecipes(data.recipes) };
};

// おすすめレシピを取得
export const fetchRecommendedRecipesService = async (userId: string): Promise<Recipe[]> => {
  const res = await fetch(`${backendUrl}/api/recommendations/${userId}`);
  const data = await handleApiResponse(res);

  if (!data || !Array.isArray(data)) {
    return [];
  }

  try {
    return mapRecipes(data);
  } catch (error) {
    return [];
  }
};

// ユーザーのお気に入りレシピを取得
const fetchUserFavorites = async (userId: string) => {
  const res = await fetch(`${backendUrl}/api/user/favorites?userId=${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user favorites");
  }

  return res.json();
};

// Query hooks
export const useRecipes = () => {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: fetchRecipesService,
  });
};

export const useFetchRecipesAPI = (ingredients: { id: number; quantity: number }[]) => {
  return useQuery({
    queryKey: recipeKeys.list(JSON.stringify(ingredients)),
    queryFn: async () => {
      const validIngredients = ingredients.filter(ing => ing.quantity > 0);

      if (validIngredients.length === 0) {
        return [];
      }

      try {
        const response = await fetchRecipesAPI(validIngredients);

        return response;
      } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }
    },
    enabled: ingredients.length > 0,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュを保持
    gcTime: 30 * 60 * 1000, // 30分間キャッシュを保持
    refetchOnMount: false, // マウント時の再取得を無効化
    refetchOnWindowFocus: false, // ウィンドウフォーカス時の再取得を無効化
  });
};

export const useSearchRecipes = (query: string) => {
  return useQuery({
    queryKey: recipeKeys.list(query),
    queryFn: () => {
      if (!query) {
        return Promise.resolve([]);
      }
      return fetchSearchRecipes(query);
    },
    enabled: false, // デフォルトで検索を無効化
  });
};

export const useRecommendedRecipes = (userId: string | undefined) => {
  return useQuery({
    queryKey: recipeKeys.recommended(userId || ""),
    queryFn: async () => {
      if (!userId) {
        return [];
      }
      return fetchRecommendedRecipesService(userId);
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useUserRecipes = (userId: string | undefined) => {
  return useQuery({
    queryKey: recipeKeys.userRecipes(userId || ""),
    queryFn: async () => {
      if (!userId) return { recipes: [] };
      return fetchUserRecipes(userId);
    },
    enabled: !!userId,
  });
};

export const useFavorites = (userId: string) => {
  return useQuery({
    queryKey: recipeKeys.favorites(userId),
    queryFn: () => fetchUserFavorites(userId),
  });
};

// Mutation hooks
export const useAddRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ formData, userId, isPublic, isDraft }: {
      formData: FormData;
      userId?: string;
      isPublic?: boolean;
      isDraft?: boolean;
    }) => {
      if (userId) {
        formData.append("user_id", userId);
      }
      if (isPublic !== undefined) {
        formData.append("public", isPublic.toString());
      }
      if (isDraft !== undefined) {
        formData.append("is_draft", isDraft.toString());
      }
      return addRecipeService(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.userRecipes("") });
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteRecipeService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.userRecipes("") });
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      return updateRecipeService(id, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.userRecipes("") });
    },
  });
};

// レシピソート機能
export const useSortedRecipes = (filteredRecipes: Recipe[] | null | undefined) => {
  const recipeStore = useRecipeStore();
  const sortBy = recipeStore?.sortBy || 'rating_desc';

  // filteredRecipesがnullまたはundefinedの場合は空配列を返す
  if (!filteredRecipes) {
    return [];
  }

  return sortRecipes(filteredRecipes, sortBy);
};

// 下書きレシピの保存
export const saveDraftRecipe = async (userId: string, recipeData: any) => {
  try {
    console.log('🔥 Starting saveDraftRecipe');
    console.log('📦 Input userId:', userId);
    console.log('📦 Input recipeData:', JSON.stringify(recipeData, null, 2));

    // JSONデータの作成
    const draftData = {
      userId: userId,
      recipeData: recipeData,
      lastModifiedAt: new Date().toISOString()
    };

    console.log('📦 Draft data to be sent:', JSON.stringify(draftData, null, 2));

    const response = await api.post("/admin/draft-recipes", draftData, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    console.log('✅ Response:', response.data);
    return response.data;
  } catch (error: any) {
    console.error("❌ Failed to save draft recipe:", error);
    console.error("❌ Error response:", error.response?.data);
    console.error("❌ Error status:", error.response?.status);
    throw error;
  }
};

// 下書きレシピの取得
export const getDraftRecipe = async (userId: string) => {
  try {
    console.log('🔥 Fetching draft recipe for user:', userId);
    const response = await api.get(`/admin/draft-recipes/${userId}`);
    const draftRecipes = response.data;

    // 下書きレシピの内容を詳細にログ出力
    if (draftRecipes.draftRecipes && draftRecipes.draftRecipes.length > 0) {
      const draftRecipe = draftRecipes.draftRecipes[0];
      console.log('📝 Draft Recipe Details:');
      console.log('👤 User ID:', draftRecipe.userId);
      console.log('🕒 Last Modified:', draftRecipe.lastModifiedAt);
      console.log('📋 Recipe Data:', JSON.stringify(draftRecipe.recipeData, null, 2));
    } else {
      console.log('ℹ️ No draft recipe found');
    }

    // 最新の下書きを返す
    return draftRecipes.length > 0 ? draftRecipes[0] : null;
  } catch (error) {
    console.error("❌ Failed to get draft recipe:", error);
    throw error;
  }
};

// 下書き保存用のカスタムフック
export const useDraftRecipe = (userId: string | undefined, isEditing: boolean = false) => {
  const queryClient = useQueryClient();

  const saveDraftMutation = useMutation({
    mutationFn: async (recipeData: any) => {
      if (!userId) throw new Error("User ID is required");
      if (isEditing) return null; // 編集時は下書きを保存しない
      console.log('💾 Saving draft recipe for user:', userId);
      console.log('📦 Recipe data to save:', JSON.stringify(recipeData, null, 2));
      return saveDraftRecipe(userId, recipeData);
    },
  });

  const { data: draftRecipe, isLoading } = useQuery({
    queryKey: ["draftRecipe", userId],
    queryFn: () => {
      if (!userId || isEditing) return null; // 編集時は下書きを読み込まない
      return getDraftRecipe(userId);
    },
    enabled: !!userId && !isEditing, // 編集時はクエリを無効化
  });

  return {
    saveDraft: saveDraftMutation.mutate,
    draftRecipe,
    isLoading,
  };
};