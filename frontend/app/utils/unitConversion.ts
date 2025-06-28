// 単位間の換算係数を定義
// 栄養素データは単位に依存した値（大さじ1杯分、1個分など）

export interface UnitConversion {
  fromUnit: string;
  toUnit: string;
  conversionFactor: number;
}

// 単位換算係数の定義
export const UNIT_CONVERSIONS: UnitConversion[] = [
  // 大さじ関連
  { fromUnit: "大さじ", toUnit: "g", conversionFactor: 18 }, // 大さじ1 = 18g
  { fromUnit: "大さじ", toUnit: "ml", conversionFactor: 15 }, // 大さじ1 = 15ml
  { fromUnit: "大さじ", toUnit: "小さじ", conversionFactor: 3 }, // 大さじ1 = 小さじ3
  { fromUnit: "大さじ", toUnit: "滴", conversionFactor: 300 }, // 大さじ1 = 約300滴
  
  // 小さじ関連
  { fromUnit: "小さじ", toUnit: "g", conversionFactor: 6 }, // 小さじ1 = 6g
  { fromUnit: "小さじ", toUnit: "ml", conversionFactor: 5 }, // 小さじ1 = 5ml
  { fromUnit: "小さじ", toUnit: "大さじ", conversionFactor: 1/3 }, // 小さじ1 = 大さじ1/3
  { fromUnit: "小さじ", toUnit: "滴", conversionFactor: 100 }, // 小さじ1 = 約100滴
  
  // カップ関連
  { fromUnit: "カップ", toUnit: "g", conversionFactor: 200 }, // カップ1 = 200g
  { fromUnit: "カップ", toUnit: "ml", conversionFactor: 200 }, // カップ1 = 200ml
  { fromUnit: "カップ", toUnit: "大さじ", conversionFactor: 13.33 }, // カップ1 = 大さじ13.33
  { fromUnit: "カップ", toUnit: "小さじ", conversionFactor: 40 }, // カップ1 = 小さじ40
  
  // 重量・容量単位
  { fromUnit: "g", toUnit: "kg", conversionFactor: 0.001 }, // 1g = 0.001kg
  { fromUnit: "kg", toUnit: "g", conversionFactor: 1000 }, // 1kg = 1000g
  { fromUnit: "ml", toUnit: "L", conversionFactor: 0.001 }, // 1ml = 0.001L
  { fromUnit: "L", toUnit: "ml", conversionFactor: 1000 }, // 1L = 1000ml
  
  // 存在型単位（適量、少々、ひとつまみ）は相互変換可能
  { fromUnit: "適量", toUnit: "少々", conversionFactor: 2 }, // 適量 = 少々の2倍程度
  { fromUnit: "少々", toUnit: "適量", conversionFactor: 0.5 }, // 少々 = 適量の0.5倍
  { fromUnit: "適量", toUnit: "ひとつまみ", conversionFactor: 1.5 }, // 適量 = ひとつまみの1.5倍
  { fromUnit: "ひとつまみ", toUnit: "適量", conversionFactor: 1/1.5 }, // ひとつまみ = 適量の1/1.5倍
  { fromUnit: "少々", toUnit: "ひとつまみ", conversionFactor: 0.75 }, // 少々 = ひとつまみの0.75倍
  { fromUnit: "ひとつまみ", toUnit: "少々", conversionFactor: 1/0.75 }, // ひとつまみ = 少々の1/0.75倍
  
  // 滴関連
  { fromUnit: "滴", toUnit: "ml", conversionFactor: 0.05 }, // 1滴 = 約0.05ml
  { fromUnit: "ml", toUnit: "滴", conversionFactor: 20 }, // 1ml = 約20滴
];

// 対応可能な単位のリスト
export const SUPPORTED_UNITS = [
  // 重量・容量単位
  "g", "kg", "ml", "L",
  // 調味料系単位
  "大さじ", "小さじ", "カップ", "滴",
  // 存在型単位
  "適量", "少々", "ひとつまみ"
];

// 存在型単位のリスト
export const PRESENCE_UNITS = ["適量", "少々", "ひとつまみ"];

// 単位が対応可能かどうかをチェックする関数
export const isUnitSupported = (unit: string): boolean => {
  return SUPPORTED_UNITS.includes(unit);
};

// 存在型単位かどうかをチェックする関数
export const isPresenceUnit = (unit: string): boolean => {
  return PRESENCE_UNITS.includes(unit);
};

// 単位間の換算係数を取得する関数
export const getConversionFactor = (fromUnit: string, toUnit: string): number => {
  // 同じ単位の場合は1を返す
  if (fromUnit === toUnit) {
    return 1;
  }
  
  // 直接の換算係数を探す
  const directConversion = UNIT_CONVERSIONS.find(
    conv => conv.fromUnit === fromUnit && conv.toUnit === toUnit
  );
  
  if (directConversion) {
    return directConversion.conversionFactor;
  }
  
  // 逆方向の換算係数を探す
  const reverseConversion = UNIT_CONVERSIONS.find(
    conv => conv.fromUnit === toUnit && conv.toUnit === fromUnit
  );
  
  if (reverseConversion) {
    return 1 / reverseConversion.conversionFactor;
  }
  
  // 換算係数が見つからない場合は1を返す（デフォルト）
  return 1;
};

// 栄養素データを別の単位に換算する関数
// nutrition: 具材の初期単位での栄養素データ（例：大さじ1杯分）
// fromUnit: 具材の初期単位（例：大さじ）
// toUnit: 選択された単位（例：g）
// quantity: 選択された単位での数量（例：50g）
export const convertNutritionToUnit = (
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
  },
  fromUnit: string,
  toUnit: string,
  quantity: number
) => {
  // 同じ単位の場合は、栄養素データをそのまま返す（数量計算は別途行う）
  if (fromUnit === toUnit) {
    return nutrition;
  }
  
  // 単位換算係数を取得
  const conversionFactor = getConversionFactor(fromUnit, toUnit);
  
  // 選択された単位での数量を、具材の初期単位に換算
  // 例：50gを大さじに換算すると、50g ÷ 18 = 約2.78大さじ
  const convertedQuantity = quantity / conversionFactor;
  
  // 換算された数量に基づいて栄養素を計算
  return {
    calories: Math.round(nutrition.calories * convertedQuantity),
    protein: Number((nutrition.protein * convertedQuantity).toFixed(1)),
    fat: Number((nutrition.fat * convertedQuantity).toFixed(1)),
    carbohydrates: Number((nutrition.carbohydrates * convertedQuantity).toFixed(1)),
    salt: Number((nutrition.salt * convertedQuantity).toFixed(2)),
  };
}; 