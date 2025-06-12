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
  gramEquivalent: number;
}

export const calculateNutrition = (ingredients: IngredientWithNutrition[]) => {
  const initialNutrition = {
    calories: 0,
    protein: 0,
    fat: 0,
    carbohydrates: 0,
    salt: 0,
  };

  const result = ingredients.reduce((acc, ingredient) => {
    // 実際の重量を計算
    let actualWeight = ingredient.quantity;
    
    // 単位が"g"以外の場合は、gramEquivalentを使用して重量を計算
    if (ingredient.unit.name !== "g") {
      actualWeight = ingredient.quantity * ingredient.gramEquivalent;
    }

    // 100gあたりの栄養素の値を実際の重量に基づいて計算
    const weightRatio = actualWeight / 100;

    return {
      calories: acc.calories + ingredient.nutrition.calories * weightRatio,
      protein: acc.protein + ingredient.nutrition.protein * weightRatio,
      fat: acc.fat + ingredient.nutrition.fat * weightRatio,
      carbohydrates: acc.carbohydrates + ingredient.nutrition.carbohydrates * weightRatio,
      salt: acc.salt + ingredient.nutrition.salt * weightRatio,
    };
  }, initialNutrition);

  // 結果を適切な小数点以下桁数に丸める
  return {
    calories: Math.round(result.calories),
    protein: Number(result.protein.toFixed(1)),
    fat: Number(result.fat.toFixed(1)),
    carbohydrates: Number(result.carbohydrates.toFixed(1)),
    salt: Number(result.salt.toFixed(2)),
  };
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