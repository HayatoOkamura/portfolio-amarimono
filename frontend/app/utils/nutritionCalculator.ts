import { Unit } from "@/app/types/index";

interface Nutrition {
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  salt: number;
}

interface IngredientWithNutrition {
  id: number;
  name: string;
  quantity: number;
  unit: Unit;
  nutrition: Nutrition;
  gramEquivalent: number; // 100gに相当する量
}

export const calculateNutrition = (ingredients: IngredientWithNutrition[]): Nutrition => {
  const nutrition: Nutrition = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    salt: 0,
  };

  ingredients.forEach((ing) => {
    if (ing.nutrition) {
      // 具材のgramEquivalentを使用して量をgに変換
      const quantityInGrams = (ing.quantity * ing.gramEquivalent);
      const ratio = quantityInGrams / 100;

      nutrition.calories += Math.floor(ing.nutrition.calories * ratio);
      nutrition.protein += Number((ing.nutrition.protein * ratio).toFixed(1));
      nutrition.fat += Number((ing.nutrition.fat * ratio).toFixed(1));
      nutrition.carbohydrates += Number((ing.nutrition.carbohydrates * ratio).toFixed(1));
      nutrition.salt += Number((ing.nutrition.salt * ratio).toFixed(2));
    }
  });

  return nutrition;
};

// 100gあたりの栄養素を、指定された単位と量に換算する
export const calculateNutritionForQuantity = (
  nutrition: Nutrition,
  quantity: number,
  unit: Unit,
  gramEquivalent: number
): Nutrition => {
  // 単位が'presence'の場合は、そのまま返す
  if (unit.type === 'presence') {
    return nutrition;
  }

  // 換算係数を計算（例：卵1個が50gの場合、gramEquivalentは50）
  const conversionFactor = (quantity * gramEquivalent) / 100;

  return {
    calories: Math.round(nutrition.calories * conversionFactor),
    protein: Math.round(nutrition.protein * conversionFactor * 10) / 10,
    fat: Math.round(nutrition.fat * conversionFactor * 10) / 10,
    carbohydrates: Math.round(nutrition.carbohydrates * conversionFactor * 10) / 10,
    salt: Math.round(nutrition.salt * conversionFactor * 100) / 100,
  };
};

// 複数の具材の栄養素を合計する
export const calculateTotalNutrition = (
  ingredients: IngredientWithNutrition[]
): Nutrition => {
  return ingredients.reduce(
    (total, ingredient) => {
      const nutrition = calculateNutritionForQuantity(
        ingredient.nutrition,
        ingredient.quantity,
        ingredient.unit,
        ingredient.gramEquivalent
      );

      return {
        calories: total.calories + nutrition.calories,
        protein: total.protein + nutrition.protein,
        fat: total.fat + nutrition.fat,
        carbohydrates: total.carbohydrates + nutrition.carbohydrates,
        salt: total.salt + nutrition.salt,
      };
    },
    {
      calories: 0,
      protein: 0,
      fat: 0,
      carbohydrates: 0,
      salt: 0,
    }
  );
}; 