// utils/sortRecipes.ts
import { Recipe } from "@/app/types/index";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating"
import useIngredientStore from "@/app/stores/ingredientStore";

// 調味料の単位を判定する関数
const isSeasoning = (unitName: string) => {
  return ['大さじ', '小さじ', '適量', '少々', 'ひとつまみ'].includes(unitName);
};

// レシピの具材一致度を計算する関数
const calculateIngredientMatch = (recipe: Recipe, selectedIngredients: { id: number; quantity: number }[]) => {
  // 調味料を除いた具材のIDを取得
  const recipeIngredientIds = recipe.ingredients
    .filter(ing => !isSeasoning(ing.unit.name))
    .map(ing => ing.id);

  // 選択された具材のIDを取得
  const selectedIngredientIds = selectedIngredients.map(ing => ing.id);

  // 一致する具材の数を計算
  const matchingIngredients = selectedIngredientIds.filter(id => 
    recipeIngredientIds.includes(id)
  );

  return matchingIngredients.length;
};

export const sortRecipes = (recipes: Recipe[], sortBy: string): Recipe[] => {
  const selectedIngredients = useIngredientStore.getState().ingredients.map(ing => ({
    id: ing.id,
    quantity: ing.quantity
  }));

  return [...recipes].sort((a, b) => {
    // 平均評価を算出 (レビューが undefined の可能性があるため安全に処理)
    const ratingA = calculateAverageRating(a.reviews || []);
    const ratingB = calculateAverageRating(b.reviews || []);

    switch (sortBy) {
      case "cost_asc":
        return a.costEstimate - b.costEstimate;
      case "rating_desc":
        return ratingB - ratingA;
      case "time_asc":
        return a.cookingTime - b.cookingTime;
      case "calorie_asc":
        return (a.nutrition?.calories || 0) - (b.nutrition?.calories || 0);
      case "ingredient_match":
        const matchA = calculateIngredientMatch(a, selectedIngredients);
        const matchB = calculateIngredientMatch(b, selectedIngredients);
        return matchB - matchA; // 一致度が高い順
      default:
        return 0;
    }
  });
};
