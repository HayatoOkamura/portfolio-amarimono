import { 
  getConversionFactor, 
  convertNutritionToUnit, 
  SUPPORTED_UNITS, 
  PRESENCE_UNITS, 
  isUnitSupported, 
  isPresenceUnit 
} from '../unitConversion';

describe('unitConversion', () => {
  describe('getConversionFactor', () => {
    it('同じ単位の場合は1を返す', () => {
      expect(getConversionFactor('g', 'g')).toBe(1);
      expect(getConversionFactor('大さじ', '大さじ')).toBe(1);
    });

    it('大さじからgへの換算が正しく動作する', () => {
      expect(getConversionFactor('大さじ', 'g')).toBe(18);
    });

    it('gから大さじへの換算が正しく動作する', () => {
      expect(getConversionFactor('g', '大さじ')).toBe(1/18);
    });

    it('小さじからgへの換算が正しく動作する', () => {
      expect(getConversionFactor('小さじ', 'g')).toBe(6);
    });

    it('大さじから小さじへの換算が正しく動作する', () => {
      expect(getConversionFactor('大さじ', '小さじ')).toBe(3);
    });

    it('存在型単位の換算が正しく動作する', () => {
      expect(getConversionFactor('適量', '少々')).toBe(2);
      expect(getConversionFactor('少々', '適量')).toBe(0.5);
      expect(getConversionFactor('適量', 'ひとつまみ')).toBe(1.5);
      expect(getConversionFactor('ひとつまみ', '適量')).toBe(1/1.5);
    });

    it('滴関連の換算が正しく動作する', () => {
      expect(getConversionFactor('滴', 'ml')).toBe(0.05);
      expect(getConversionFactor('ml', '滴')).toBe(20);
      expect(getConversionFactor('大さじ', '滴')).toBe(300);
      expect(getConversionFactor('小さじ', '滴')).toBe(100);
    });

    it('換算係数が見つからない場合は1を返す', () => {
      expect(getConversionFactor('unknown', 'g')).toBe(1);
    });
  });

  describe('convertNutritionToUnit', () => {
    // 大さじ1杯分の栄養素データ
    const mockNutrition = {
      calories: 100,
      protein: 10,
      fat: 5,
      carbohydrates: 15,
      salt: 0.5
    };

    it('同じ単位の場合は栄養素データをそのまま返す', () => {
      const result = convertNutritionToUnit(mockNutrition, '大さじ', '大さじ', 2);
      // 同じ単位の場合は栄養素データをそのまま返す（数量計算は別途行う）
      expect(result.calories).toBe(100);
      expect(result.protein).toBe(10);
      expect(result.fat).toBe(5);
      expect(result.carbohydrates).toBe(15);
      expect(result.salt).toBe(0.5);
    });

    it('大さじからgへの栄養素換算が正しく動作する', () => {
      const result = convertNutritionToUnit(mockNutrition, '大さじ', 'g', 36);
      // 36g = 大さじ2杯分 (36 ÷ 18 = 2)
      expect(result.calories).toBe(200); // 100 * 2
      expect(result.protein).toBe(20); // 10 * 2
      expect(result.fat).toBe(10); // 5 * 2
      expect(result.carbohydrates).toBe(30); // 15 * 2
      expect(result.salt).toBe(1); // 0.5 * 2
    });

    it('gから大さじへの栄養素換算が正しく動作する', () => {
      const result = convertNutritionToUnit(mockNutrition, '大さじ', 'g', 18);
      // 18g = 大さじ1杯分 (18 ÷ 18 = 1)
      expect(result.calories).toBe(100); // 100 * 1
      expect(result.protein).toBe(10); // 10 * 1
      expect(result.fat).toBe(5); // 5 * 1
      expect(result.carbohydrates).toBe(15); // 15 * 1
      expect(result.salt).toBe(0.5); // 0.5 * 1
    });

    it('存在型単位の栄養素換算が正しく動作する', () => {
      const result = convertNutritionToUnit(mockNutrition, '適量', '少々', 1);
      // 適量から少々への換算 (適量 = 少々の2倍)
      expect(result.calories).toBe(50); // 100 * 0.5
      expect(result.protein).toBe(5); // 10 * 0.5
      expect(result.fat).toBe(2.5); // 5 * 0.5
      expect(result.carbohydrates).toBe(7.5); // 15 * 0.5
      expect(result.salt).toBe(0.25); // 0.5 * 0.5
    });

    it('数量が0の場合は栄養素も0になる', () => {
      const result = convertNutritionToUnit(mockNutrition, '大さじ', 'g', 0);
      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
      expect(result.fat).toBe(0);
      expect(result.carbohydrates).toBe(0);
      expect(result.salt).toBe(0);
    });
  });

  describe('SUPPORTED_UNITS', () => {
    it('対応可能な単位が正しく定義されている', () => {
      expect(SUPPORTED_UNITS).toContain('g');
      expect(SUPPORTED_UNITS).toContain('kg');
      expect(SUPPORTED_UNITS).toContain('ml');
      expect(SUPPORTED_UNITS).toContain('L');
      expect(SUPPORTED_UNITS).toContain('大さじ');
      expect(SUPPORTED_UNITS).toContain('小さじ');
      expect(SUPPORTED_UNITS).toContain('カップ');
      expect(SUPPORTED_UNITS).toContain('滴');
      expect(SUPPORTED_UNITS).toContain('適量');
      expect(SUPPORTED_UNITS).toContain('少々');
      expect(SUPPORTED_UNITS).toContain('ひとつまみ');
    });

    it('不要な単位が含まれていない', () => {
      expect(SUPPORTED_UNITS).not.toContain('個');
      expect(SUPPORTED_UNITS).not.toContain('枚');
      expect(SUPPORTED_UNITS).not.toContain('本');
    });
  });

  describe('PRESENCE_UNITS', () => {
    it('存在型単位が正しく定義されている', () => {
      expect(PRESENCE_UNITS).toContain('適量');
      expect(PRESENCE_UNITS).toContain('少々');
      expect(PRESENCE_UNITS).toContain('ひとつまみ');
    });

    it('存在型単位の数が正しい', () => {
      expect(PRESENCE_UNITS).toHaveLength(3);
    });
  });

  describe('isUnitSupported', () => {
    it('対応可能な単位はtrueを返す', () => {
      expect(isUnitSupported('g')).toBe(true);
      expect(isUnitSupported('大さじ')).toBe(true);
      expect(isUnitSupported('適量')).toBe(true);
    });

    it('対応不可能な単位はfalseを返す', () => {
      expect(isUnitSupported('個')).toBe(false);
      expect(isUnitSupported('枚')).toBe(false);
      expect(isUnitSupported('unknown')).toBe(false);
    });
  });

  describe('isPresenceUnit', () => {
    it('存在型単位はtrueを返す', () => {
      expect(isPresenceUnit('適量')).toBe(true);
      expect(isPresenceUnit('少々')).toBe(true);
      expect(isPresenceUnit('ひとつまみ')).toBe(true);
    });

    it('存在型以外の単位はfalseを返す', () => {
      expect(isPresenceUnit('g')).toBe(false);
      expect(isPresenceUnit('大さじ')).toBe(false);
      expect(isPresenceUnit('個')).toBe(false);
    });
  });
}); 