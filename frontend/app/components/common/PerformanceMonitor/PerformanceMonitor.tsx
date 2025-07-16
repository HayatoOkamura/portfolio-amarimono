"use client";

import { useEffect } from 'react';
import { initPerformanceMonitoring } from '@/app/utils/performance';

const PerformanceMonitor: React.FC = () => {
  useEffect(() => {
    initPerformanceMonitoring();
  }, []);

  return null;
};

export default PerformanceMonitor; 