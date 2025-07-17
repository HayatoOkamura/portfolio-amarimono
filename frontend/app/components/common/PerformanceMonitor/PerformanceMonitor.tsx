"use client";

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/app/utils/performance';

const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== 'undefined') {
      initPerformanceMonitoring();
    }
  }, []);

  return null;
};

export default PerformanceMonitor; 