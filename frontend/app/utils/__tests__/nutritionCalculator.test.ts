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

      const result = calculateNutrition(ingredients);

      // 卵: 2個 × 50g = 100g
      // りんご: 1個 × 300g = 300g
      // 合計: 400g
      expect(result.calories).toBe(400); // 100kcal × 4
      expect(result.protein).toBe(40); // 10g × 4
      expect(result.fat).toBe(20); // 5g × 4
      expect(result.carbohydrates).toBe(60); // 15g × 4
      expect(result.salt).toBe(2); // 0.5g × 4
    });

    it('栄養素データがない具材は計算から除外される', () => {
      const ingredients = [
        {
          id: 1,
          name: '卵',
          quantity: 2,
          unit: mockUnit,
          nutrition: mockNutrition,
          gramEquivalent: 50
        },
        {
          id: 2,
          name: '塩',
          quantity: 1,
          unit: mockUnit,
          nutrition: {
            calories: 0,
            protein: 0,
            fat: 0,
            carbohydrates: 0,
            salt: 0
          },
          gramEquivalent: 5
        }
      ];

      const result = calculateNutrition(ingredients);

      // 卵のみ計算
      expect(result.calories).toBe(100); // 100kcal × 1
      expect(result.protein).toBe(10); // 10g × 1
      expect(result.fat).toBe(5); // 5g × 1
      expect(result.carbohydrates).toBe(15); // 15g × 1
      expect(result.salt).toBe(0.5); // 0.5g × 1
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

      // 2個 × 50g = 100g
      expect(result.calories).toBe(100); // 100kcal × 1
      expect(result.protein).toBe(10); // 10g × 1
      expect(result.fat).toBe(5); // 5g × 1
      expect(result.carbohydrates).toBe(15); // 15g × 1
      expect(result.salt).toBe(0.5); // 0.5g × 1
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

      // 1.5個 × 50g = 75g
      expect(result.calories).toBe(75); // 100kcal × 0.75
      expect(result.protein).toBe(7.6); // 10.123g × 0.75
      expect(result.fat).toBe(4.1); // 5.456g × 0.75
      expect(result.carbohydrates).toBe(11.8); // 15.789g × 0.75
      expect(result.salt).toBe(0.09); // 0.123g × 0.75
    });
  });

  describe('calculateTotalNutrition', () => {
    it('複数の具材の栄養素を合計できる', () => {
      const ingredients = [
        {
          id: 1,
          name: '卵',
          quantity: 2,
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

      // 卵: 2個 × 50g = 100g
      // りんご: 1個 × 300g = 300g
      // 合計: 400g
      expect(result.calories).toBe(400); // 100kcal × 4
      expect(result.protein).toBe(40); // 10g × 4
      expect(result.fat).toBe(20); // 5g × 4
      expect(result.carbohydrates).toBe(60); // 15g × 4
      expect(result.salt).toBe(2); // 0.5g × 4
    });

    it('空の配列の場合は0を返す', () => {
      const result = calculateTotalNutrition([]);

      expect(result).toEqual({
        calories: 0,
        protein: 0,
        fat: 0,
        carbohydrates: 0,
        salt: 0
      });
    });
  });
}); 