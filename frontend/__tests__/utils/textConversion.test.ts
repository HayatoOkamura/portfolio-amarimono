import { normalizeTextForSearch, matchesSearchQuery, matchesSearchQuerySync } from '../../app/utils/textConversion';
import { convertKanjiToHiragana } from '../../app/utils/japaneseDictionary';

describe('textConversion', () => {
  describe('convertKanjiToHiragana', () => {
    it('should convert kanji to hiragana', () => {
      const result = convertKanjiToHiragana('玉ねぎ');
      expect(result).toBe('たまねぎ');
    });

    it('should convert 人参 to にんじん', () => {
      const result = convertKanjiToHiragana('人参');
      expect(result).toBe('にんじん');
    });

    it('should convert 大根 to だいこん', () => {
      const result = convertKanjiToHiragana('大根');
      expect(result).toBe('だいこん');
    });

    it('should handle text without kanji', () => {
      const result = convertKanjiToHiragana('たまねぎ');
      expect(result).toBe('たまねぎ');
    });

    it('should handle empty string', () => {
      const result = convertKanjiToHiragana('');
      expect(result).toBe('');
    });
  });

  describe('normalizeTextForSearch', () => {
    it('should normalize text for search', async () => {
      const result = await normalizeTextForSearch('玉ねぎ');
      expect(result).toContain('たまねぎ');
      expect(result).toContain('タマネギ');
    });

    it('should handle empty string', async () => {
      const result = await normalizeTextForSearch('');
      expect(result).toBe('');
    });

    it('should handle katakana to hiragana', async () => {
      const result = await normalizeTextForSearch('キムチ');
      expect(result).toContain('きむち');
    });
  });

  describe('matchesSearchQuery', () => {
    it('should match hiragana search with kanji', async () => {
      const result = await matchesSearchQuery('たまねぎ', '玉ねぎ');
      expect(result).toBe(true);
    });

    it('should match hiragana search with katakana', async () => {
      const result = await matchesSearchQuery('きむち', 'キムチ');
      expect(result).toBe(true);
    });

    it('should match katakana search with hiragana', async () => {
      const result = await matchesSearchQuery('キムチ', 'きむち');
      expect(result).toBe(true);
    });

    it('should match exact text', async () => {
      const result = await matchesSearchQuery('玉ねぎ', '玉ねぎ');
      expect(result).toBe(true);
    });

    it('should return false for no match', async () => {
      const result = await matchesSearchQuery('たまねぎ', 'にんじん');
      expect(result).toBe(false);
    });

    it('should handle empty query', async () => {
      const result = await matchesSearchQuery('', '玉ねぎ');
      expect(result).toBe(false);
    });

    it('should handle empty target', async () => {
      const result = await matchesSearchQuery('たまねぎ', '');
      expect(result).toBe(false);
    });
  });

  describe('matchesSearchQuerySync', () => {
    it('should match hiragana search with katakana', () => {
      const result = matchesSearchQuerySync('きむち', 'キムチ');
      expect(result).toBe(true);
    });

    it('should match katakana search with hiragana', () => {
      const result = matchesSearchQuerySync('キムチ', 'きむち');
      expect(result).toBe(true);
    });

    it('should match exact text', () => {
      const result = matchesSearchQuerySync('玉ねぎ', '玉ねぎ');
      expect(result).toBe(true);
    });

    it('should return false for no match', () => {
      const result = matchesSearchQuerySync('たまねぎ', 'にんじん');
      expect(result).toBe(false);
    });
  });
}); 