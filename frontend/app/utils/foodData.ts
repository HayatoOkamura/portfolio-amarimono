import foodDataJson from './foodData.json';

// foodData.jsonの型定義
type FoodDataJson = {
  [key: string]: {
    name: string;
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
  }
};

export interface FoodData {
  name: string;
  calories: number;
  protein: number;
  fat: number;
  carbohydrates: number;
  salt: number;
}

export interface FoodDataWithKey extends FoodData {
  key: string;
}

// 食品データを配列に変換
const foodDataArray: FoodDataWithKey[] = Object.entries(foodDataJson as unknown as FoodDataJson)
  .filter(([key]) => key !== '単位' && key !== '成分識別子') // ヘッダー行を除外
  .map(([key, data]) => ({
    ...data,
    key
  }));

export function searchFoodData(query: string): FoodDataWithKey[] {
  if (!query) return [];
  
  const searchQuery = query.toLowerCase();
  return foodDataArray.filter(food => {
    const foodName = food.name.toLowerCase();
    // カテゴリ名（＜＞で囲まれた部分）を除去して検索
    const cleanName = foodName.replace(/＜.*?＞\s*/, '');
    return cleanName.includes(searchQuery);
  });
}

export function getNutritionData(foodKey: string): FoodData {
  const food = (foodDataJson as unknown as FoodDataJson)[foodKey];
  if (!food) {
    console.error('Food not found for key:', foodKey); // デバッグログ
    throw new Error('食品データが見つかりませんでした。別の名前で検索してみてください。');
  }
  
  return {
    name: food.name,
    calories: food.calories,
    protein: food.protein,
    fat: food.fat,
    carbohydrates: food.carbohydrates,
    salt: food.salt
  };
}

export default {
  searchFoodData,
  getNutritionData,
}; 