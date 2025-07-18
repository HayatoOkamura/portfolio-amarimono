"use client";

import Image from 'next/image';
import { useMemo } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  quality?: number;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  onLoad?: () => void;
}

export default function OptimizedImage({
  src,
  alt,
  width = 256,
  height = 256,
  className = "",
  priority = false,
  loading = "lazy",
  sizes,
  quality = 75,
  onError,
  onLoad,
}: OptimizedImageProps) {
  const isCloudflareR2 = useMemo(() => {
    return src.includes('pub-a63f718fe8894565998a27328e2d1b15.r2.dev');
  }, [src]);

  // Cloudflare R2の画像の場合は通常のimgタグを使用
  if (isCloudflareR2) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? undefined : loading}
        onError={onError}
        onLoad={onLoad}
        style={{
          objectFit: 'cover',
          borderRadius: '0.5rem',
        }}
      />
    );
  }

  // その他の画像はNext.jsのImageコンポーネントを使用
  // priorityがtrueの場合はloadingプロパティを無視
  const imageProps: any = {
    src,
    alt,
    width,
    height,
    className,
    priority,
    sizes,
    quality,
    onError,
    onLoad,
    style: {
      objectFit: 'cover',
      borderRadius: '0.5rem',
    }
  };

  // priorityがfalseの場合のみloadingプロパティを追加
  if (!priority) {
    imageProps.loading = loading;
  }

  return <Image {...imageProps} />;
} 