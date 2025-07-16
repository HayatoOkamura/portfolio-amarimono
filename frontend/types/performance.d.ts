// パフォーマンス監視の型定義

declare global {
  interface PerformanceEntry {
    element?: Element;
    size?: number;
    id?: string;
    url?: string;
    processingStart?: number;
    processingEnd?: number;
    target?: EventTarget;
    value?: number;
    hadRecentInput?: boolean;
    sources?: Array<{
      node?: Node;
      currentRect?: DOMRectReadOnly;
      previousRect?: DOMRectReadOnly;
    }>;
  }
}

export {}; 