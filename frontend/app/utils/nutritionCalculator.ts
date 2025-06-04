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
      // 単位に基づいて量をgに変換
      let quantityInGrams = ing.quantity;
      
      // 単位に応じてgに変換
      switch (ing.unit.name) {
        // 個数系単位
        case '個':
        case '本':
        case '房':
        case '株':
        case '袋':
        case '缶':
        case '匹':
        case '尾':
        case 'パック':
          quantityInGrams = ing.quantity * 100;
          break;
        case '枚':
          quantityInGrams = ing.quantity * 20;
          break;
        case '切れ':
          quantityInGrams = ing.quantity * 50;
          break;
        
        // 調味料系単位
        case '小さじ':
          quantityInGrams = ing.quantity * 5;
          break;
        case '大さじ':
          quantityInGrams = ing.quantity * 15;
          break;
        case 'カップ':
          quantityInGrams = ing.quantity * 200;
          break;
        
        // 質量・容量単位
        case 'kg':
          quantityInGrams = ing.quantity * 1000;
          break;
        case 'ml':
          quantityInGrams = ing.quantity;
          break;
        case 'L':
          quantityInGrams = ing.quantity * 1000;
          break;
        
        // その他
        case '滴':
          quantityInGrams = ing.quantity;
          break;
        case '適量':
        case '少々':
          quantityInGrams = 0;
          break;
        
        // すでにgの場合はそのまま
        case 'g':
          quantityInGrams = ing.quantity;
          break;
        default:
          console.warn(`未対応の単位: ${ing.unit.name}、gとして計算します`);
          quantityInGrams = ing.quantity;
      }

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