import { useState, useEffect, useCallback } from 'react';
import { matchesSearchQuery, matchesSearchQuerySync } from '@/app/utils/textConversion';

interface UseTextSearchOptions {
  useAsync?: boolean;
  debounceMs?: number;
}

export const useTextSearch = (options: UseTextSearchOptions = {}) => {
  const { useAsync = false, debounceMs = 300 } = options;
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // デバウンス処理
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [searchTerm, debounceMs]);

  // 非同期検索関数
  const searchAsync = useCallback(async (query: string, targets: string[]): Promise<boolean[]> => {
    if (!useAsync) {
      // 同期的な検索を使用
      return targets.map(target => matchesSearchQuerySync(query, target));
    }

    setIsSearching(true);
    try {
      const results = await Promise.all(
        targets.map(target => matchesSearchQuery(query, target))
      );
      return results;
    } catch (error) {
      console.error('Search error:', error);
      // エラー時は同期的な検索にフォールバック
      return targets.map(target => matchesSearchQuerySync(query, target));
    } finally {
      setIsSearching(false);
    }
  }, [useAsync]);

  // 検索実行
  const executeSearch = useCallback(async (targets: string[]): Promise<boolean[]> => {
    if (!debouncedSearchTerm) {
      return targets.map(() => true); // 検索語が空の場合は全て表示
    }
    return searchAsync(debouncedSearchTerm, targets);
  }, [debouncedSearchTerm, searchAsync]);

  return {
    searchTerm,
    setSearchTerm,
    debouncedSearchTerm,
    isSearching,
    executeSearch,
  };
}; 