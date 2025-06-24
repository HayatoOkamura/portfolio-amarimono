import Image from 'next/image';
import { useMemo } from 'react';

interface RecipeImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export default function RecipeImage({ src, alt, width = 256, height = 256 }: RecipeImageProps) {
    const imageUrl = useMemo(() => {
        if (typeof window !== 'undefined') {
            // クライアントサイドでは現在のホストに基づいて画像URLを設定
            const currentHost = window.location.hostname;
            
            // 開発環境の場合、同じホストの54321ポートを使用
            if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                return `http://localhost:54321/storage/v1/object/public/images/${src}`;
            }
            
            // ローカルネットワークの場合（192.168.x.xなど）
            if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
                return `http://${currentHost}:54321/storage/v1/object/public/images/${src}`;
            }
            
            // その他の場合は環境変数を使用
            if (process.env.ENVIRONMENT === 'production') {
                return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${src}`;
            } else {
                return `${process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL}/${src}`;
            }
        } else {
            // サーバーサイドでは環境変数を使用
            if (process.env.ENVIRONMENT === 'production') {
                return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${src}`;
            } else {
                return `${process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL}/${src}`;
            }
        }
    }, [src]);

    return (
        <Image
            src={imageUrl}
            alt={alt}
            width={width}
            height={height}
            className="object-cover rounded-lg"
        />
    );
} 