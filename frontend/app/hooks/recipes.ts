/* eslint-disable */
"use client"
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from "@tanstack/react-query";
import { Recipe, Instruction, Ingredient, Review } from "../types/index";
import { backendUrl, handleApiResponse } from "../utils/api";
import useRecipeStore from "@/app/stores/recipeStore";
import { sortRecipes } from "@/app/utils/sortRecipes";
import { api } from "@/app/utils/api";
import { SearchMode } from "@/app/stores/ingredientStore";
import toast from "react-hot-toast";

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
      type: 'presence' | 'quantity';
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
  genre_id?: number;
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
    salt: number;
  } | null;
  nutrition_percentage: {
    calories: number;
    carbohydrates: number;
    fat: number;
    protein: number;
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
    salt: 0,
  };

  // genre_idが存在する場合は、それを使用してgenreオブジェクトを構築
  const genre = recipe.genre_id ? {
    id: recipe.genre_id,
    name: recipe.genre?.name || ''
  } : recipe.genre;

  const isSeasoningUnit = (unitName: string) => {
    return ['大さじ', '小さじ', '適量', '少々', 'ひとつまみ'].includes(unitName);
  };

  return {
    id: recipe.id,
    name: recipe.name,
    instructions: (recipe.instructions || []).map((step) => ({
      id: step.stepNumber?.toString() || '',
      stepNumber: step.stepNumber || 0,
      description: step.description || '',
      imageUrl: step.image_url || undefined,
    })),
    ingredients: (recipe.ingredients || []).map((ingredient) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      englishName: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: {
        id: ingredient.ingredient.unit?.id || 0,
        name: ingredient.ingredient.unit?.name || "",
        description: ingredient.ingredient.unit?.description || "",
        step: ingredient.ingredient.unit?.step || 1,
        type: ingredient.ingredient.unit?.name === "presence" ? "presence" : "quantity"
      },
      genre: { id: 0, name: "すべて" },
      imageUrl: null,
      nutrition: {
        calories: 0,
        carbohydrates: 0,
        fat: 0,
        protein: 0,
        salt: 0
      },
      gramEquivalent: 0
    })),
    genre: genre,
    imageUrl: recipe.image_url || undefined,
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
      englishName: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: {
        id: ingredient.ingredient.unit?.id || 0,
        name: ingredient.ingredient.unit?.name || "",
        description: ingredient.ingredient.unit?.description || "",
        step: ingredient.ingredient.unit?.step || 1,
        type: ingredient.ingredient.unit?.name === "presence" ? "presence" : "quantity"
      },
      genre: {
        id: 0,
        name: ''
      },
      imageUrl: null,
      nutrition: {
        calories: 0,
        carbohydrates: 0,
        fat: 0,
        protein: 0,
        salt: 0
      },
      gramEquivalent: 0
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
export const fetchRecipesAPI = async (ingredients: { id: number; quantity: number }[], searchMode: SearchMode = 'exact_with_quantity') => {
  if (ingredients.length === 0) {
    throw new Error("具材が選択されていません");
  }

  const transformedIngredients = ingredients.map(({ id, quantity }) => ({
    ingredientId: id,
    quantityRequired: quantity
  }));

  await new Promise(resolve => setTimeout(resolve, 500))

  console.log("🥦", transformedIngredients);
  console.log("🥦 searchMode:", searchMode);

  const requestBody = {
    ingredients: transformedIngredients,
    searchMode: searchMode
  };



  try {
    const response = await api.post("/api/recipes", requestBody);



    console.log("🥦 リクエストURL", api.defaults.baseURL);
    console.log("🥦", response.data);

    return Array.isArray(response.data) ? mapRecipes(response.data) : [];
  } catch (error: any) {
    console.error('Error fetching recipes:', error);
    throw error;
  }
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
  try {
    console.log("🔍 DEBUG - fetchRecipeByIdService called with ID:", id);
    
    const response = await api.get(`/admin/recipes/${id}`);
    
    console.log("🔍 DEBUG - API Response:");
    console.log("   📝 Response data:", response.data);
    console.log("   📝 Response data type:", typeof response.data);
    console.log("   📝 Response data keys:", Object.keys(response.data || {}));
    
    if (!response.data) {
      throw new Error('Recipe data not found');
    }
    
    // レスポンスデータが直接recipeオブジェクトの場合
    if (!response.data.recipe) {
      console.log("🔍 DEBUG - Using direct recipe data");
      console.log("   📝 Recipe ID from API:", response.data.id);
      console.log("   📝 Recipe ID type:", typeof response.data.id);
      return mapRecipe(response.data);
    }
    
    // レスポンスデータが{ recipe: ... }の形式の場合
    console.log("🔍 DEBUG - Using nested recipe data");
    console.log("   📝 Recipe ID from API:", response.data.recipe.id);
    console.log("   📝 Recipe ID type:", typeof response.data.recipe.id);
    return mapRecipe(response.data.recipe);
  } catch (error: any) {
    console.error('Error in fetchRecipeByIdService:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      console.error('Error status:', error.response.status);
      throw new Error(error.response.data.error || 'Failed to fetch recipe');
    }
    throw error;
  }
};

// 新規レシピの登録
export const addRecipeService = async (formData: FormData): Promise<Recipe> => {
  try {
    // 画像ファイルの存在確認
    const imageFiles = Array.from(formData.entries())
      .filter(([key, value]) => value instanceof File)
      .map(([key, value]) => ({ key, file: value as File }));

    // 各instructionの詳細を確認
    const instructions = JSON.parse(formData.get('instructions') as string);

    // formDataの中身ををログ出力
    formData.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });


    const response = await api.post("/admin/recipes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      }
    });

    
    // レスポンスデータの型チェック
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // レスポンスデータの構造を確認
    if (response.data.recipe) {
      return mapRecipe(response.data.recipe);
    }

    if (typeof response.data === 'object' && 'id' in response.data) {
      return mapRecipe(response.data);
    }

    throw new Error('Invalid response format: ' + JSON.stringify(response.data));
  } catch (error: any) {
    console.error('Error in addRecipeService:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    
    // エラーメッセージの詳細を追加
    const errorMessage = error.response?.data?.error || error.message || 'Failed to add recipe';
    throw new Error(`Failed to add recipe: ${errorMessage}`);
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
          .map((ing: any) => {
            return {
              ingredient_id: ing.ingredient_id,
              quantity_required: ing.quantity_required,
              unit_id: ing.unit_id
            };
          });

        // 具材データが空でないことを確認
        if (formattedIngredients.length === 0) {
          throw new Error("具材を選択してください");
        }

        const newIngredientsString = JSON.stringify(formattedIngredients);

        updatedData.delete("ingredients");
        updatedData.append("ingredients", newIngredientsString);
      } else {
        throw new Error("Invalid ingredients data format");
      }
    }

    //updatedDataの中身をログ出力
    updatedData.forEach((value, key) => {
      console.log(`🚨${key}: ${value}`);
    });

    const response = await api.put(`/admin/recipes/${id}`, updatedData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    console.log("🚨🚨🚨 Response data:", response.data);

    // レスポンスデータの型チェック
    if (!response.data) {
      throw new Error('No data received from server');
    }

    // レスポンスデータの構造を確認
    if (response.data.recipe) {
      return mapRecipe(response.data.recipe);
    }

    if (typeof response.data === 'object' && 'id' in response.data) {
      return mapRecipe(response.data);
    }

    throw new Error('Invalid response format: ' + JSON.stringify(response.data));
  } catch (error: any) {
    console.error("Error in updateRecipeService:", error);
    console.error("Error response:", error.response?.data);
    console.error("Error status:", error.response?.status);
    
    // エラーメッセージの詳細を追加
    const errorMessage = error.response?.data?.error || error.message || 'Failed to update recipe';
    throw new Error(`Failed to update recipe: ${errorMessage}`);
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
      toast.success(data.message || "お気に入りを更新しました");
    } else {
      console.error("Failed to toggle like");
      toast.error("お気に入りの更新に失敗しました");
    }
  } catch (error) {
    console.error("Error toggling like", error);
    toast.error("お気に入りの更新に失敗しました");
  }
};

// ユーザーのレシピ一覧を取得
const fetchUserRecipes = async (userId: string) => {
  try {
    const response = await api.get(`/api/user/recipes?userId=${userId}`);
    return mapRecipes(response.data.recipes);
  } catch (error) {
    console.error("Error in fetchUserRecipes:", error);
    throw error;
  }
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
  const res = await fetch(`${backendUrl}/api/likes/${userId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch user favorites");
  }

  const data = await res.json();
  return mapRecipes(data);
};

// Query hooks
export const useRecipe = (id: string) => {
  return useQuery({
    queryKey: recipeKeys.detail(id),
    queryFn: () => fetchRecipeByIdService(id),
    enabled: !!id && id !== "recipes",
  });
};

export const useRecipes = () => {
  return useQuery({
    queryKey: recipeKeys.lists(),
    queryFn: fetchRecipesService,
  });
};

export const useFetchRecipesAPI = (
  ingredients: { id: number; quantity: number }[],
  searchMode: SearchMode = 'exact_with_quantity',
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
  }
) => {
  
  return useQuery<Recipe[], Error>({
    queryKey: recipeKeys.list(JSON.stringify({ ingredients, searchMode })),
    queryFn: async () => {
      const validIngredients = ingredients.filter(ing => {
        return ing && ing.id && ing.quantity > 0;
      });
      
      if (validIngredients.length === 0) {
        throw new Error("具材が選択されていません");
      }
      
      try {
        const response = await fetchRecipesAPI(validIngredients, searchMode);
        return response;
      } catch (error) {
        console.error('Error fetching recipes:', error);
        throw error;
      }
    },
    enabled: options?.enabled ?? false,
    staleTime: options?.staleTime ?? 0,
    refetchOnMount: options?.refetchOnMount ?? false,
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
    refetchOnReconnect: options?.refetchOnReconnect ?? false
  });
};

export const useSearchRecipes = (
  query: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
    refetchOnMount?: boolean;
    refetchOnWindowFocus?: boolean;
    refetchOnReconnect?: boolean;
    onSuccess?: () => void;
    onSettled?: () => void;
  }
) => {
  return useQuery({
    queryKey: recipeKeys.list(query),
    queryFn: () => {
      if (!query) return Promise.resolve([]);
      return fetchSearchRecipes(query);
    },
    ...options
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
      if (!userId) return [];
      const response = await fetchUserRecipes(userId);
      return response;
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: recipeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: recipeKeys.userRecipes("") });
    },
    onError: (error: Error) => {
      console.error('Error adding recipe:', error);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
      throw error;
    }
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
  return sortRecipes(filteredRecipes || [], sortBy);
};

// 下書きレシピの保存
export const saveDraftRecipe = async (userId: string, recipeData: any) => {
  try {

    // ローカルストレージに保存
    const draftData = {
      userId: userId,
      recipeData: recipeData,
      lastModifiedAt: new Date().toISOString()
    };

    localStorage.setItem(`draft_recipe_${userId}`, JSON.stringify(draftData));
    return draftData;
  } catch (error: any) {
    console.error("❌ Failed to save draft recipe:", error);
    throw error;
  }
};

// 下書きレシピの取得
export const getDraftRecipe = async (userId: string) => {
  try {
    const draftData = localStorage.getItem(`draft_recipe_${userId}`);
    
    if (!draftData) {
      return null;
    }

    const parsedData = JSON.parse(draftData);

    return parsedData;
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

// いいね状態のチェック
export const checkLikeStatusService = async (userId: string, recipeId: string): Promise<boolean> => {
  try {
    const response = await fetch(`${backendUrl}/api/likes/${userId}`);
    if (response.ok) {
      const data = await response.json();
      return data.some((like: any) => like.id === recipeId);
    }
    return false;
  } catch (error) {
    console.error("Error checking like status:", error);
    return false;
  }
};