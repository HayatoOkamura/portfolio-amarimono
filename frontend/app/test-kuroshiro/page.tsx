"use client";

import { useState } from 'react';
import { normalizeTextForSearch, matchesSearchQuery } from '@/app/utils/textConversion';
import { convertKanjiToHiragana } from '@/app/utils/japaneseDictionary';

export default function TestKuroshiroPage() {
  const [inputText, setInputText] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTest = async () => {
    if (!inputText) return;
    
    setIsLoading(true);
    try {
      const normalized = await normalizeTextForSearch(inputText);
      setResult(normalized);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchTest = async () => {
    if (!inputText) return;
    
    setIsLoading(true);
    try {
      const matches = await matchesSearchQuery(inputText, '玉ねぎ');
      setResult(`Search for "${inputText}" in "玉ねぎ": ${matches}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKanjiTest = () => {
    if (!inputText) return;
    
    try {
      const converted = convertKanjiToHiragana(inputText);
      setResult(`Kanji conversion: "${inputText}" → "${converted}"`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Japanese Text Conversion Test Page</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="テストする文字列を入力"
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={handleTest}
            disabled={isLoading}
            style={{ padding: '10px 20px' }}
          >
            {isLoading ? '処理中...' : '完全正規化テスト'}
          </button>
          
          <button 
            onClick={handleSearchTest}
            disabled={isLoading}
            style={{ padding: '10px 20px' }}
          >
            {isLoading ? '処理中...' : '検索テスト'}
          </button>
          
          <button 
            onClick={handleKanjiTest}
            style={{ padding: '10px 20px' }}
          >
            漢字変換テスト
          </button>
        </div>
      </div>
      
      {result && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#f5f5f5', 
          borderRadius: '5px',
          whiteSpace: 'pre-wrap'
        }}>
          <strong>結果:</strong>
          <br />
          {result}
        </div>
      )}
      
      <div style={{ marginTop: '20px' }}>
        <h3>テスト例:</h3>
        <ul>
          <li>玉ねぎ → たまねぎ</li>
          <li>人参 → にんじん</li>
          <li>大根 → だいこん</li>
          <li>白菜 → はくさい</li>
          <li>茄子 → なす</li>
          <li>生姜 → しょうが</li>
          <li>玉葱 → たまねぎ</li>
          <li>椎茸 → しいたけ</li>
          <li>豚肉 → ぶたにく</li>
          <li>鮭 → さけ</li>
          <li>醤油 → しょうゆ</li>
          <li>豆腐 → とうふ</li>
        </ul>
      </div>
    </div>
  );
} 