import React from 'react';

// 画像のぼかしプレースホルダー生成ユーティリティ

/**
 * 具材画像用のぼかしプレースホルダーを生成
 * @param width 幅
 * @param height 高さ
 * @returns base64エンコードされたぼかし画像
 */
export const generateBlurPlaceholder = (width: number = 100, height: number = 100): string => {
  // 具材画像に適した色合いのぼかしプレースホルダー
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#f8f9fa" stop-opacity="1"/>
          <stop offset="50%" stop-color="#e9ecef" stop-opacity="1"/>
          <stop offset="100%" stop-color="#dee2e6" stop-opacity="1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
      <rect width="100%" height="100%" fill="url(#g)" opacity="0.5"/>
    </svg>
  `;

  // SVGをbase64にエンコード
  const base64 = btoa(svg);
  return `data:image/svg+xml;base64,${base64}`;
};

/**
 * 具材画像用のデフォルトぼかしプレースホルダー
 */
export const INGREDIENT_BLUR_PLACEHOLDER = generateBlurPlaceholder(100, 100);

/**
 * 画像の読み込み状態を管理するフック
 */
export const useImageLoadState = () => {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return {
    isLoading,
    hasError,
    handleLoad,
    handleError,
  };
}; 