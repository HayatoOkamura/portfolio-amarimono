import { Unit } from "@/app/types/index";
import { convertNutritionToUnit } from "./unitConversion";

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
  selectedUnit?: string;
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
    const currentUnit = ingredient.selectedUnit || ingredient.unit.name;
    
    const convertedNutrition = convertNutritionToUnit(
      ingredient.nutrition,
      ingredient.unit.name,
      currentUnit,
      ingredient.quantity
    );

    return {
      calories: acc.calories + convertedNutrition.calories,
      protein: acc.protein + convertedNutrition.protein,
      fat: acc.fat + convertedNutrition.fat,
      carbohydrates: acc.carbohydrates + convertedNutrition.carbohydrates,
      salt: acc.salt + convertedNutrition.salt,
    };
  }, initialNutrition);

  return {
    calories: Math.round(result.calories),
    protein: Number(result.protein.toFixed(1)),
    fat: Number(result.fat.toFixed(1)),
    carbohydrates: Number(result.carbohydrates.toFixed(1)),
    salt: Number(result.salt.toFixed(2)),
  };
};

export const calculateNutritionForQuantity = (
  nutrition: Nutrition,
  quantity: number,
  unit: Unit,
  gramEquivalent: number
): Nutrition => {
  if (unit.type === 'presence') {
    return nutrition;
  }

  const conversionFactor = (quantity * gramEquivalent) / 100;

  return {
    calories: Math.round(nutrition.calories * conversionFactor),
    protein: Math.round(nutrition.protein * conversionFactor * 10) / 10,
    fat: Math.round(nutrition.fat * conversionFactor * 10) / 10,
    carbohydrates: Math.round(nutrition.carbohydrates * conversionFactor * 10) / 10,
    salt: Math.round(nutrition.salt * conversionFactor * 100) / 100,
  };
};

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