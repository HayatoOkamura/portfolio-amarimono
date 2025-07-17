// パフォーマンス監視のためのユーティリティ

// PerformanceObserverの型定義
interface PerformanceEntryWithElement extends PerformanceEntry {
  element?: Element;
  size?: number;
  id?: string;
  url?: string;
}

interface PerformanceEntryWithProcessing extends PerformanceEntry {
  processingStart?: number;
  processingEnd?: number;
  target?: EventTarget;
}

interface LayoutShiftEntry extends PerformanceEntry {
  value: number;
  hadRecentInput: boolean;
  sources?: Array<{
    node?: Node;
    currentRect?: DOMRectReadOnly;
    previousRect?: DOMRectReadOnly;
  }>;
}

// ブラウザ環境のチェック
const isBrowser = typeof window !== 'undefined';
const hasPerformanceObserver = isBrowser && 'PerformanceObserver' in window;

export const measureImageLoadTime = (imageUrl: string): Promise<number> => {
  return new Promise((resolve) => {
    if (!isBrowser) {
      resolve(0);
      return;
    }
    
    const startTime = performance.now();
    const img = new Image();
    
    img.onload = () => {
      const loadTime = performance.now() - startTime;
      console.log(`Image loaded: ${imageUrl} in ${loadTime.toFixed(2)}ms`);
      resolve(loadTime);
    };
    
    img.onerror = () => {
      const loadTime = performance.now() - startTime;
      console.error(`Image failed to load: ${imageUrl} after ${loadTime.toFixed(2)}ms`);
      resolve(loadTime);
    };
    
    img.src = imageUrl;
  });
};

export const measureLCP = (): void => {
  if (!hasPerformanceObserver) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntryWithElement[];
      const lastEntry = entries[entries.length - 1];
      
      if (lastEntry) {
        console.log('LCP:', {
          element: lastEntry.element,
          value: lastEntry.startTime,
          size: lastEntry.size,
          id: lastEntry.id,
          url: lastEntry.url
        });
      }
    });
    
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.warn('LCP measurement failed:', error);
  }
};

export const measureFID = (): void => {
  if (!hasPerformanceObserver) return;
  
  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as PerformanceEntryWithProcessing[];
      entries.forEach((entry) => {
        if (entry.processingStart) {
          console.log('FID:', {
            value: entry.processingStart - entry.startTime,
            startTime: entry.startTime,
            processingStart: entry.processingStart,
            processingEnd: entry.processingEnd,
            target: entry.target
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.warn('FID measurement failed:', error);
  }
};

export const measureCLS = (): void => {
  if (!hasPerformanceObserver) return;
  
  try {
    let clsValue = 0;
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries() as LayoutShiftEntry[];
      entries.forEach((entry) => {
        if (!entry.hadRecentInput) {
          clsValue += entry.value;
          console.log('CLS:', {
            value: entry.value,
            total: clsValue,
            sources: entry.sources
          });
        }
      });
    });
    
    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.warn('CLS measurement failed:', error);
  }
};

// 本番環境でもパフォーマンス監視を有効化（軽量化）
export const initPerformanceMonitoring = (): void => {
  if (isBrowser) {
    try {
      // 本番環境では軽量版の監視のみ実行
      if (process.env.NODE_ENV === 'production') {
        // Core Web Vitalsの監視のみ
        measureLCP();
        measureFID();
        measureCLS();
      } else {
        // 開発環境では詳細な監視
        measureLCP();
        measureFID();
        measureCLS();
        
        // 追加のパフォーマンス指標
        if ('performance' in window) {
          // ナビゲーションタイミング
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            console.log('Navigation Timing:', {
              domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
              loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
              domInteractive: navigation.domInteractive,
              firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime,
              firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
            });
          }
        }
      }
    } catch (error) {
      console.warn('Performance monitoring initialization failed:', error);
    }
  }
}; 