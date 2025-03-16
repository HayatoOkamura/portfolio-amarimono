// utils/sortRecipes.ts
import { Recipe } from "@/app/types/index";
import { calculateAverageRating } from "@/app/utils/calculateAverageRating"

export const sortRecipes = (recipes: Recipe[], sortBy: string): Recipe[] => {
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
        return a.nutrition.calories - b.nutrition.calories;
      default:
        return 0;
    }
  });
};
