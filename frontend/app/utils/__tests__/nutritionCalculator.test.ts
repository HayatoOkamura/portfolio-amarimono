import { calculateNutrition, calculateNutritionForQuantity, calculateTotalNutrition } from '../nutritionCalculator';
import { Unit } from '@/app/types/index';

describe('nutritionCalculator', () => {
  const mockUnit: Unit = {
    id: 1,
    name: '個',
    description: '個数',
    step: 1,
    type: 'quantity'
  };

  const mockPresenceUnit: Unit = {
    id: 2,
    name: '適量',
    description: '適量',
    step: 1,
    type: 'presence'
  };

  // 1個あたりの栄養素データ
  const mockNutrition = {
    calories: 100,
    protein: 10,
    fat: 5,
    carbohydrates: 15,
    salt: 0.5
  };

  describe('calculateNutrition', () => {
    it('複数の具材の栄養素を正しく計算できる', () => {
      const ingredients = [
        {
          id: 1,
          name: '卵',
          quantity: 2,
          unit: mockUnit,
          nutrition: mockNutrition,
          gramEquivalent: 50,
          selectedUnit: '個'
        },
        {
          id: 2,
          name: 'りんご',
          quantity: 1,
          unit: mockUnit,
          nutrition: mockNutrition,
          gramEquivalent: 300,
          selectedUnit: '個'
        }
      ];

      const result = calculateNutrition(ingredients);

      // 卵: 2個分の栄養素
      // りんご: 1個分の栄養素
      // 合計: 3個分
      expect(result.calories).toBe(300); // 100kcal × 3
      expect(result.protein).toBe(30); // 10g × 3
      expect(result.fat).toBe(15); // 5g × 3
      expect(result.carbohydrates).toBe(45); // 15g × 3
      expect(result.salt).toBe(1.5); // 0.5g × 3
    });

    it('単位が変更された具材の栄養素を正しく計算できる', () => {
      const ingredients = [
        {
          id: 1,
          name: '塩',
          quantity: 50, // 50g
          unit: { ...mockUnit, name: '大さじ' },
          nutrition: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0,
            salt: 18 // 大さじ1杯あたり18gの塩
          },
          gramEquivalent: 18,
          selectedUnit: 'g' // gに変更
        }
      ];

      const result = calculateNutrition(ingredients);

      // 塩: 50g = 大さじ約2.78杯分 (50 ÷ 18 = 2.78)
      // 大さじ1杯 = 18gの塩なので、50g = 18g × 2.78 = 50g
      expect(result.salt).toBe(50); // 18g × 2.78 = 50g
    });

    it('存在型単位の具材も栄養素を正しく計算する', () => {
      const ingredients = [
        {
          id: 1,
          name: '塩',
          quantity: 1,
          unit: mockPresenceUnit,
          nutrition: mockNutrition,
          gramEquivalent: 0,
          selectedUnit: '適量'
        }
      ];

      const result = calculateNutrition(ingredients);

      // 存在型単位でも、選択された単位に基づいて栄養素を計算
      expect(result.calories).toBe(100);
      expect(result.protein).toBe(10);
      expect(result.fat).toBe(5);
      expect(result.carbohydrates).toBe(15);
      expect(result.salt).toBe(0.5);
    });
  });

  describe('calculateNutritionForQuantity', () => {
    it('指定された量に応じて栄養素を正しく計算できる', () => {
      const result = calculateNutritionForQuantity(
        mockNutrition,
        2,
        mockUnit,
        50
      );

      // 2個分の栄養素
      expect(result.calories).toBe(200); // 100kcal × 2
      expect(result.protein).toBe(20); // 10g × 2
      expect(result.fat).toBe(10); // 5g × 2
      expect(result.carbohydrates).toBe(30); // 15g × 2
      expect(result.salt).toBe(1); // 0.5g × 2
    });

    it('presenceタイプの単位の場合は栄養素をそのまま返す', () => {
      const result = calculateNutritionForQuantity(
        mockNutrition,
        1,
        mockPresenceUnit,
        0
      );

      expect(result).toEqual(mockNutrition);
    });

    it('端数処理が正しく行われる', () => {
      const result = calculateNutritionForQuantity(
        {
          calories: 100,
          protein: 10.123,
          fat: 5.456,
          carbohydrates: 15.789,
          salt: 0.123
        },
        1.5,
        mockUnit,
        50
      );

      // 1.5個分の栄養素
      expect(result.calories).toBe(150); // 100kcal × 1.5
      expect(result.protein).toBe(15.2); // 10.123g × 1.5
      expect(result.fat).toBe(8.2); // 5.456g × 1.5
      expect(result.carbohydrates).toBe(23.7); // 15.789g × 1.5
      expect(result.salt).toBe(0.18); // 0.123g × 1.5
    });
  });

  describe('calculateTotalNutrition', () => {
    it('複数の具材の栄養素を合計できる', () => {
      const ingredients = [
        {
          id: 1,
          name: '卵',
          quantity: 1,
          unit: mockUnit,
          nutrition: mockNutrition,
          gramEquivalent: 50
        },
        {
          id: 2,
          name: 'りんご',
          quantity: 1,
          unit: mockUnit,
          nutrition: mockNutrition,
          gramEquivalent: 300
        }
      ];

      const result = calculateTotalNutrition(ingredients);

      // 卵: 1個分の栄養素
      // りんご: 1個分の栄養素
      // 合計: 2個分
      expect(result.calories).toBe(200); // 100kcal × 2
      expect(result.protein).toBe(20); // 10g × 2
      expect(result.fat).toBe(10); // 5g × 2
      expect(result.carbohydrates).toBe(30); // 15g × 2
      expect(result.salt).toBe(1); // 0.5g × 2
    });
  });
}); 