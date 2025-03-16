/* eslint-disable */
"use client"
import { useState, useEffect } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { backendUrl, handleApiResponse } from "../utils/apiUtils";
import { Recipe, RecipeResponse } from "../types";
import useRecipeStore from "@/app/stores/recipeStore";
import { sortRecipes } from "@/app/utils/sortRecipes";

// 一覧
export const fetchRecipesService = async (): Promise<Recipe[]> => {
  const res = await fetch(`${backendUrl}/admin/recipes`);
  const data = await handleApiResponse(res);

  return data.map((recipe: any) => ({
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions.map((step: any) => ({
      stepNumber: step.stepNumber,
      description: step.description,
      imageUrl: step.image_url,
    })),
    genre: recipe.genre,
    imageUrl: recipe.image_url,
    ingredients: recipe.ingredients.map((ingredient: any) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: ingredient.ingredient.unit
    })),
    cookingTime: recipe.cooking_time,
    reviews: recipe.reviews,
    costEstimate: recipe.cost_estimate,
    summary: recipe.summary,
    catchphrase: recipe.catchphrase,
    nutrition: {
      calories: recipe.nutrition.calories,
      carbohydrates: recipe.nutrition.carbohydrates,
      fat: recipe.nutrition.fat,
      protein: recipe.nutrition.protein,
      sugar: recipe.nutrition.sugar,
      salt: recipe.nutrition.salt,
    },
    faq: recipe.faq,
  }));
};

// 検索
export const fetchRecipesAPI = async (ingredients: { id: number; quantity: number }[]) => {
  // 具材が空の場合はリクエストを送信しない
  if (ingredients.length === 0) {
    throw new Error("具材が選択されていません");
  }

  // 送信前にフィールド名を変換
  const transformedIngredients = ingredients.map(({ id, quantity }) => ({
    ingredientId: id,
    quantityRequired: quantity
  }));

  //ルーディング画面がわかりやすくするために処理
  await new Promise(resolve => setTimeout(resolve, 500))

  const response = await fetch(`${backendUrl}/api/recipes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transformedIngredients),
  });

  const data = await handleApiResponse(response);


  return Array.isArray(data)
    ? data.map((recipe: any) => ({
      id: recipe.id,
      name: recipe.name,
      instructions: recipe.instructions.map((step: any) => ({
        stepNumber: step.stepNumber,
        description: step.description,
        imageUrl: step.image_url,
      })),
      genre: recipe.genre,
      imageUrl: recipe.image_url,
      ingredients: recipe.ingredients.map((ingredient: any) => ({
        id: ingredient.ingredient_id,
        name: ingredient.ingredient.name,
        quantity: ingredient.quantity_required,
        unit: {
          id: ingredient.ingredient.unit.id,
          name: ingredient.ingredient.unit.name,
        }
      })),
      cookingTime: recipe.cooking_time,
      reviews: recipe.reviews.map((review: any) => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createAt: review.create_at,
        updataAt: review.updata_at,
      })),
      costEstimate: recipe.cost_estimate,
      summary: recipe.summary,
      catchphrase: recipe.catchphrase,
      nutrition: {
        calories: recipe.nutrition.calories,
        carbohydrates: recipe.nutrition.carbohydrates,
        fat: recipe.nutrition.fat,
        protein: recipe.nutrition.protein,
        sugar: recipe.nutrition.sugar,
        salt: recipe.nutrition.salt,
      },
      faq: recipe.faq,
      nutritionPercentage: {
        calories: recipe.nutrition_percentage.calories,
        carbohydrates: recipe.nutrition_percentage.carbohydrates,
        fat: recipe.nutrition_percentage.fat,
        protein: recipe.nutrition_percentage.protein,
        sugar: recipe.nutrition_percentage.sugar,
        salt: recipe.nutrition_percentage.salt,
      },
    }))
    : [];
}

// レシピ名検索
export const fetchSearchRecipes = async (query: string): Promise<Recipe[]> => {
  const res = await fetch(`${backendUrl}/api/recipes/search?q=${encodeURIComponent(query)}`);
  const data = await handleApiResponse(res);
  
  return data.map((recipe: any) => ({
    id: recipe.id,
    name: recipe.name,
    instructions: recipe.instructions.map((step: any) => ({
      stepNumber: step.stepNumber,
      description: step.description,
      imageUrl: step.image_url,
    })),
    genre: recipe.genre,
    imageUrl: recipe.image_url,
    ingredients: recipe.ingredients.map((ingredient: any) => ({
      id: ingredient.ingredient_id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: ingredient.ingredient.unit
    })),
    cookingTime: recipe.cooking_time,
    reviews: recipe.reviews,
    costEstimate: recipe.cost_estimate,
    summary: recipe.summary,
    catchphrase: recipe.catchphrase,
    nutrition: {
      calories: recipe.nutrition.calories,
      carbohydrates: recipe.nutrition.carbohydrates,
      fat: recipe.nutrition.fat,
      protein: recipe.nutrition.protein,
      sugar: recipe.nutrition.sugar,
      salt: recipe.nutrition.salt,
    },
    faq: recipe.faq,
  }));
};

// 取得ID指定
export const fetchRecipeByIdService = async (id: string) => {
  const res = await fetch(`${backendUrl}/api/recipes/${id}`);
  const data = await handleApiResponse(res);

  return {
    id: data.recipe.id,
    name: data.recipe.name,
    instructions: data.recipe.instructions.map((step: any) => ({
      stepNumber: step.stepNumber,
      description: step.description,
      imageUrl: step.image_url,
    })),
    genre: data.recipe.genre,
    imageUrl: data.recipe.image_url,
    ingredients: data.recipe.ingredients.map((ingredient: any) => ({
      id: ingredient.ingredient.id,
      name: ingredient.ingredient.name,
      quantity: ingredient.quantity_required,
      unit: ingredient.ingredient.unit,
    })),
    cookingTime: data.recipe.cooking_time,
    reviews: data.recipe.reviews,
    costEstimate: data.recipe.cost_estimate,
    summary: data.recipe.summary,
    catchphrase: data.recipe.catchphrase,
    nutrition: {
      calories: data.recipe.nutrition.calories,
      carbohydrates: data.recipe.nutrition.carbohydrates,
      fat: data.recipe.nutrition.fat,
      protein: data.recipe.nutrition.protein,
      sugar: data.recipe.nutrition.sugar,
      salt: data.recipe.nutrition.salt,
    },
    faq: data.recipe.faq,
    nutritionPercentage: {
      calories: data.recipe.nutrition_percentage.calories,
      carbohydrates: data.recipe.nutrition_percentage.carbohydrates,
      fat: data.recipe.nutrition_percentage.fat,
      protein: data.recipe.nutrition_percentage.protein,
      sugar: data.recipe.nutrition_percentage.sugar,
      salt: data.recipe.nutrition_percentage.salt,
    },
  };
};

// 追加
export const addRecipeService = async (formData: FormData): Promise<Recipe> => {
  console.log("FormData entries:");
  for (const [key, value] of formData.entries()) {
    console.log(`${key}:`, value);
  }
  try {
    const res = await fetch(`${backendUrl}/admin/recipes`, {
      method: "POST",
      body: formData,
    });

    console.log("🚀 APIレスポンス:", res.status, res.statusText);

    // HTTP ステータスコードが 200 以外ならエラーをログに出力
    if (!res.ok) {
      const errorResponse = await res.text(); // レスポンスをテキストで取得
      console.error("🚨 APIエラー:", res.status, res.statusText, errorResponse);
      throw new Error(`APIエラー: ${res.status} ${res.statusText} - ${errorResponse}`);
    }

    // 生データを取得
    const responseText = await res.text();
    console.log("📝 APIレスポンスの内容:", responseText);

    // JSON にパース
    let newRecipe: RecipeResponse;
    try {
      newRecipe = JSON.parse(responseText);
      console.log("✅ パースしたJSON:", newRecipe);
    } catch (error) {
      console.error("❌ JSONパースエラー:", error);
      throw new Error("レスポンスがJSONではありません");
    }

    return newRecipe.recipe; // Zustandの `addRecipe` 側で状態更新
  } catch (error) {
    console.error("❌ Fetch エラー:", error);
    throw error; // 呼び出し元でエラーをキャッチできるようにする
  }
};

// 削除
export const deleteRecipeService = async (id: string): Promise<void> => {
  const res = await fetch(`${backendUrl}/admin/recipes/${id}`, {
    method: "DELETE",
  });
  await handleApiResponse(res);
};

// 更新
export const updateRecipeService = async (
  id: string,
  updatedData: FormData
): Promise<Recipe> => {
  try {
    // ingredients の修正
    const ingredientsRaw = updatedData.get("ingredients") as string;
    if (ingredientsRaw) {
      const ingredients = JSON.parse(ingredientsRaw);

      const formattedIngredients = ingredients.map((ing: any) => ({
        ingredient_id: ing.id,
        quantity_required: ing.quantity,
        unit_id: ing.unit.id,
      }));

      updatedData.delete("ingredients"); // 既存のデータを削除
      updatedData.append("ingredients", JSON.stringify(formattedIngredients));
    }

    const formDataToObject = (formData: FormData) => {
      const obj: Record<string, any> = {};
      formData.forEach((value, key) => {
        obj[key] = value;
      });
      return obj;
    };

    console.log("送信データ:", formDataToObject(updatedData));



    const res = await fetch(`${backendUrl}/admin/recipes/${id}`, {
      method: "PUT",
      body: updatedData,
    });
    const textResponse = await res.text();

    console.log("HTTPステータス:", res.status);
    console.log("レスポンス内容:", textResponse);

    return handleApiResponse(res);
  } catch (error) {
    console.error("Error updating recipe:", error);
    throw error; // エラーを再スロー
  }
};

// お気に入りレシピ登録
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
      alert(data.message); // "Like added" または "Like removed"
    } else {
      console.error("Failed to toggle like");
    }
  } catch (error) {
    console.error("Error toggling like", error);
  }
};

// お気に入りレシピ取得
export const useFavorites = () => {
  const [favoriteRecipes, setFavoriteRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchFavorites = async () => {
      try {
        const res = await fetch(`${backendUrl}/api/likes/${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch likes");

        const data: Recipe[] = await res.json();
        const formattedRecipes = Array.isArray(data)
          ? data.map((recipe: any) => ({
            id: recipe.id,
            name: recipe.name,
            instructions: recipe.instructions.map((step: any) => ({
              stepNumber: step.stepNumber,
              description: step.description,
              imageUrl: step.image_url,
            })),
            genre: recipe.genre,
            imageUrl: recipe.image_url,
            ingredients: recipe.ingredients.map((ingredient: any) => ({
              id: ingredient.ingredient_id,
              name: ingredient.ingredient.name,
              quantity: ingredient.quantity_required,
              unit: {
                id: ingredient.ingredient.unit.id,
                name: ingredient.ingredient.unit.name,
              },
            })),
            cookingTime: recipe.cooking_time,
            reviews: recipe.reviews,
            costEstimate: recipe.cost_estimate,
            summary: recipe.summary,
            catchphrase: recipe.catchphrase,
            nutrition: {
              calories: recipe.nutrition.calories,
              carbohydrates: recipe.nutrition.carbohydrates,
              fat: recipe.nutrition.fat,
              protein: recipe.nutrition.protein,
              sugar: recipe.nutrition.sugar,
              salt: recipe.nutrition.salt,
            },
            faq: recipe.faq,
          }))
          : [];

        setFavoriteRecipes(formattedRecipes);
      } catch (error) {
        console.error("Error fetching likes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  return { favoriteRecipes, loading };
};

// レシピ取得（ユーザー登録）
export const fetchUserRecipes = async (userId: string) => {

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

// レシピソート機能
export const useSortedRecipes = (filteredRecipes: Recipe[]) => {
  const { sortBy } = useRecipeStore();
  return sortRecipes(filteredRecipes, sortBy);
};