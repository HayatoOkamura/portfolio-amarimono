/* eslint-disable */
"use client"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Recipe, RecipeResponse, Instruction, Ingredient, Review } from "../types";
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
  faq: { question: string; answer: string }[];
}

// Query keys
const recipeKeys = {
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
const mapRecipe = (recipe: ApiRecipe): Recipe => {
  if (!recipe) {
    throw new Error("Recipe data is null or undefined");
  }

  const mappedRecipe = {
    id: recipe.id || "",
    name: recipe.name || "",
    instructions: (recipe.instructions || []).map((step: ApiInstruction) => ({
      id: step?.stepNumber?.toString() || "",
      stepNumber: step?.stepNumber || 1,
      description: step?.description || "",
      imageUrl: step?.image_url || undefined,
    })),
    genre: recipe.genre,
    imageUrl: recipe.image_url || undefined,
    ingredients: (recipe.ingredients || []).map((ingredient: ApiIngredient) => ({
      id: ingredient?.ingredient_id || 0,
      name: ingredient?.ingredient?.name || "",
      genre: { id: 0, name: "すべて" },
      quantity: ingredient?.quantity_required || 0,
      unit: ingredient?.ingredient?.unit
        ? {
          id: ingredient.ingredient.unit.id || 0,
          name: ingredient.ingredient.unit.name || "",
          description: "",
          step: 1,
        }
        : { id: 0, name: "", description: "", step: 1 },
    })),
    cookingTime: recipe.cooking_time || 0,
    reviews: (recipe.reviews || []).map((review: ApiReview) => ({
      id: review?.id || "",
      recipeId: recipe.id || "",
      userId: "",
      rating: review?.rating || 0,
      comment: review?.comment || "",
      createdAt: review?.create_at || "",
      updatedAt: review?.updated_at || "",
    })),
    costEstimate: recipe.cost_estimate || 0,
    summary: recipe.summary || "",
    catchphrase: recipe.catchphrase || "",
    nutrition: recipe.nutrition
      ? {
        calories: recipe.nutrition.calories || 0,
        carbohydrates: recipe.nutrition.carbohydrates || 0,
        fat: recipe.nutrition.fat || 0,
        protein: recipe.nutrition.protein || 0,
        sugar: recipe.nutrition.sugar || 0,
        salt: recipe.nutrition.salt || 0,
      }
      : null,
    faq: recipe.faq || [],
  };

  return mappedRecipe;
};

// 配列対応の関数
const mapRecipes = (data: ApiRecipe[]): Recipe[] => {
  return data.map((recipe) => ({
    id: recipe.id,
    name: recipe.name,
    imageUrl: recipe.image_url || undefined,
    instructions: recipe.instructions.map((instruction) => ({
      id: instruction.stepNumber.toString(),
      stepNumber: instruction.stepNumber,
      description: instruction.description,
      imageUrl: instruction.image_url || undefined,
    })),
    genre: recipe.genre,
    ingredients: recipe.ingredients.map((ingredient) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: ingredient.ingredient.unit ? {
        id: ingredient.ingredient.unit.id,
        name: ingredient.ingredient.unit.name,
        description: '',
        step: 1
      } : {
        id: 0,
        name: '',
        description: '',
        step: 1
      },
      genre: {
        id: 0,
        name: ''
      },
      imageUrl: null
    })),
    cookingTime: recipe.cooking_time,
    reviews: recipe.reviews.map((review) => ({
      id: review.id,
      recipeId: recipe.id,
      userId: "",
      rating: review.rating,
      comment: review.comment,
      createdAt: review.create_at,
      updatedAt: review.updated_at,
    })),
    costEstimate: recipe.cost_estimate,
    summary: recipe.summary,
    catchphrase: recipe.catchphrase,
    nutrition: recipe.nutrition,
    faq: recipe.faq,
  }));
};

// Service functions
const fetchRecipesService = async (): Promise<Recipe[]> => {
  const response = await api.get("/api/recipes");
  return response.data;
};

const fetchRecipesAPI = async (ingredients: { id: number; quantity: number }[]) => {
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

const fetchSearchRecipes = async (query: string): Promise<Recipe[]> => {
  const response = await api.get(`/api/recipes/search?q=${encodeURIComponent(query)}`);
  return mapRecipes(response.data);
};

export const fetchRecipeByIdService = async (id: string) => {
  const response = await api.get(`/api/recipes/${id}`);
  return mapRecipe(response.data.recipe);
};

const addRecipeService = async (formData: FormData): Promise<Recipe> => {
  try {
    const response = await api.post("/api/recipes", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data.recipe;
  } catch (error) {
    throw error;
  }
};

const deleteRecipeService = async (id: string): Promise<void> => {
  await api.delete(`/api/recipes?id=${id}`);
};

const updateRecipeService = async (
  id: string,
  updatedData: FormData
): Promise<Recipe> => {
  try {
    const ingredientsRaw = updatedData.get("ingredients") as string;
    if (ingredientsRaw) {
      const ingredients = JSON.parse(ingredientsRaw);

      const formattedIngredients = ingredients.map((ing: any) => ({
        ingredient_id: ing.id,
        quantity_required: ing.quantity,
        unit_id: ing.unit.id,
      }));

      updatedData.delete("ingredients");
      updatedData.append("ingredients", JSON.stringify(formattedIngredients));
    }

    updatedData.append("id", id);
    const response = await api.put("/api/recipes", updatedData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

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

  return res.json();
};

const fetchRecommendedRecipesService = async (userId: string): Promise<Recipe[]> => {
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
      // 量が0より大きい具材のみをフィルタリング
      const validIngredients = ingredients.filter(ing => ing.quantity > 0);
      
      // 具材が空の場合は空配列を返す
      if (validIngredients.length === 0) {
        console.log('No valid ingredients found, returning empty array');
        return [];
      }

      try {
        console.log('Fetching recipes with ingredients:', validIngredients);
        const response = await fetchRecipesAPI(validIngredients);
        console.log('Fetched recipes response:', response);
        return response;
      } catch (error) {
        console.error('Error fetching recipes:', error);
        return [];
      }
    },
    // 具材が空の場合はクエリを実行しない
    enabled: ingredients.length > 0,
    // キャッシュの設定
    staleTime: 5 * 60 * 1000, // 5分
    gcTime: 30 * 60 * 1000, // 30分
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
    mutationFn: async ({ formData, userId, isPublic }: { 
      formData: FormData; 
      userId?: string; 
      isPublic?: boolean;
    }) => {
      if (userId) {
        formData.append("user_id", userId);
      }
      if (isPublic !== undefined) {
        formData.append("public", isPublic.toString());
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