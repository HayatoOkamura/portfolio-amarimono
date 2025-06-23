import * as wanakana from 'wanakana';
import { convertKanjiToHiragana } from './japaneseDictionary';

/**
 * テキストを検索用に正規化する
 * ひらがな、カタカナ、漢字の変換に対応
 */
export const normalizeTextForSearch = async (text: string): Promise<string> => {
  if (!text) return '';
  
  try {
    console.log('Normalizing text:', text);
    
    // 小文字に変換
    const lowerText = text.toLowerCase();
    
    // 漢字をひらがなに変換
    console.log('Converting kanji to hiragana...');
    const hiragana = convertKanjiToHiragana(lowerText);
    console.log('Kanji conversion result:', hiragana);
    
    // 漢字変換後のテキストをカタカナに変換
    const katakana = wanakana.toKatakana(hiragana);
    
    // 元のテキストをローマ字に変換
    const romaji = wanakana.toRomaji(lowerText);
    
    const result = `${lowerText} ${hiragana} ${katakana} ${romaji}`;
    console.log('Final normalized result:', result);
    return result;
  } catch (error) {
    console.error('Error in normalizeTextForSearch:', error);
    // エラーが発生した場合はwanakanaのみを使用
    return normalizeTextForSearchFallback(text);
  }
};

/**
 * フォールバック用の正規化（wanakanaのみ使用）
 */
const normalizeTextForSearchFallback = (text: string): string => {
  if (!text) return '';
  
  const lowerText = text.toLowerCase();
  const hiragana = wanakana.toHiragana(lowerText);
  const katakana = wanakana.toKatakana(lowerText);
  const romaji = wanakana.toRomaji(lowerText);
  
  return `${lowerText} ${hiragana} ${katakana} ${romaji}`;
};

/**
 * 検索クエリとターゲットテキストを比較する（非同期版）
 * ひらがな、カタカナ、漢字の変換に対応
 */
export const matchesSearchQuery = async (query: string, target: string): Promise<boolean> => {
  if (!query || !target) return false;
  
  try {
    // クエリとターゲットを正規化
    const normalizedQuery = await normalizeTextForSearch(query);
    const normalizedTarget = await normalizeTextForSearch(target);
    
    // クエリの各部分で検索
    const queryParts = normalizedQuery.split(' ');
    const targetParts = normalizedTarget.split(' ');
    
    // クエリの各部分がターゲットのいずれかの部分と一致するかチェック
    return queryParts.some(queryPart => 
      targetParts.some(targetPart => 
        targetPart.includes(queryPart) || queryPart.includes(targetPart)
      )
    );
  } catch (error) {
    console.error('Error in matchesSearchQuery:', error);
    // エラーが発生した場合はフォールバック
    return matchesSearchQueryFallback(query, target);
  }
};

/**
 * フォールバック用の検索（wanakanaのみ使用）
 */
const matchesSearchQueryFallback = (query: string, target: string): boolean => {
  if (!query || !target) return false;
  
  const normalizedQuery = normalizeTextForSearchFallback(query);
  const normalizedTarget = normalizeTextForSearchFallback(target);
  
  const queryParts = normalizedQuery.split(' ');
  const targetParts = normalizedTarget.split(' ');
  
  return queryParts.some(queryPart => 
    targetParts.some(targetPart => 
      targetPart.includes(queryPart) || queryPart.includes(targetPart)
    )
  );
};

/**
 * 同期的な検索用の簡易版（パフォーマンス重視）
 * 完全な変換は行わず、基本的な変換のみ
 */
export const matchesSearchQuerySync = (query: string, target: string): boolean => {
  if (!query || !target) return false;
  
  const normalizedQuery = normalizeTextForSearchFallback(query);
  const normalizedTarget = normalizeTextForSearchFallback(target);
  
  const queryParts = normalizedQuery.split(' ');
  const targetParts = normalizedTarget.split(' ');
  
  return queryParts.some(queryPart => 
    targetParts.some(targetPart => 
      targetPart.includes(queryPart) || queryPart.includes(targetPart)
    )
  );
}; 