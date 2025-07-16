"use client";

import React, { useEffect, useRef } from "react";
import { imageBaseUrl } from "@/app/utils/api";

interface ImagePreloaderProps {
  imageUrls: string[];
  priority?: number;
}

const ImagePreloader: React.FC<ImagePreloaderProps> = ({ 
  imageUrls, 
  priority = 0 
}) => {
  const preloadedRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // 既にプリロード済みの画像をスキップ
    const newImages = imageUrls.filter(url => !preloadedRef.current.has(url));
    
    // 重要な画像をプリロード（優先度に応じて）
    newImages.forEach((imageUrl, index) => {
      if (imageUrl) {
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = "image";
        link.href = `${imageBaseUrl}/${imageUrl}`;
        
        // 優先度に応じてfetchpriorityを設定
        if (index < 4) {
          link.setAttribute('fetchpriority', 'high');
        } else if (index < 8) {
          link.setAttribute('fetchpriority', 'medium');
        } else {
          link.setAttribute('fetchpriority', 'low');
        }
        
        document.head.appendChild(link);
        preloadedRef.current.add(imageUrl);
      }
    });

    // クリーンアップ（コンポーネントのアンマウント時のみ）
    return () => {
      const links = document.querySelectorAll('link[rel="preload"][as="image"]');
      links.forEach((link) => {
        if (imageUrls.some(url => link.getAttribute('href')?.includes(url))) {
          document.head.removeChild(link);
        }
      });
    };
  }, [imageUrls, priority]);

  return null; // このコンポーネントは何もレンダリングしない
};

export default ImagePreloader; 