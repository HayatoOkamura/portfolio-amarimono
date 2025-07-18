import OptimizedImage from '@/app/components/ui/OptimizedImage/OptimizedImage';
import { useMemo, useState } from 'react';

interface RecipeImageProps {
    src: string;
    alt: string;
    width?: number;
    height?: number;
}

export default function RecipeImage({ src, alt, width = 256, height = 256 }: RecipeImageProps) {
    const [imageError, setImageError] = useState<string | null>(null);

    const imageUrl = useMemo(() => {
        // 本番環境でのデバッグ情報を出力
        if (process.env.ENVIRONMENT === 'production') {
            console.log('=== RecipeImage Production Debug ===');
            console.log('Original src:', src);
            console.log('NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL:', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL);
            console.log('ENVIRONMENT:', process.env.ENVIRONMENT);
        }

        if (typeof window !== 'undefined') {
            // クライアントサイドでは現在のホストに基づいて画像URLを設定
            const currentHost = window.location.hostname;
            
            if (process.env.ENVIRONMENT === 'production') {
                console.log('Current hostname:', currentHost);
                console.log('Window location:', window.location.href);
            }
            
            // 開発環境の場合、同じホストの54321ポートを使用
            if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                const url = `http://localhost:54321/storage/v1/object/public/images/${src}`;
                if (process.env.ENVIRONMENT === 'production') {
                    console.log('Development URL (localhost):', url);
                }
                return url;
            }
            
            // ローカルネットワークの場合（192.168.x.xなど）
            if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
                const url = `http://${currentHost}:54321/storage/v1/object/public/images/${src}`;
                if (process.env.ENVIRONMENT === 'production') {
                    console.log('Development URL (local network):', url);
                }
                return url;
            }
            
            // 本番環境ではCloudflare R2のURLを使用
            if (process.env.ENVIRONMENT === 'production') {
                const r2Url = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
                const url = `${r2Url}/${src}`;
                console.log('Production URL (R2):', url);
                console.log('R2 Base URL:', r2Url);
                return url;
            } else {
                const localUrl = process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL;
                const url = `${localUrl}/${src}`;
                if (process.env.ENVIRONMENT === 'production') {
                    console.log('Local URL:', url);
                }
                return url;
            }
        } else {
            // サーバーサイドでは環境変数を使用
            if (process.env.ENVIRONMENT === 'production') {
                console.log('Server-side rendering detected');
                const r2Url = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL;
                const url = `${r2Url}/${src}`;
                console.log('Server-side Production URL (R2):', url);
                return url;
            } else {
                const localUrl = process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL;
                const url = `${localUrl}/${src}`;
                if (process.env.ENVIRONMENT === 'production') {
                    console.log('Server-side Local URL:', url);
                }
                return url;
            }
        }
    }, [src]);

    // 画像読み込みエラー時のハンドラー
    const handleImageError = (error: any) => {
        console.error('=== Image Load Error ===');
        console.error('Error:', error);
        console.error('Failed URL:', imageUrl);
        console.error('Original src:', src);
        console.error('Environment:', process.env.ENVIRONMENT);
        console.error('R2 Public URL:', process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL);
        setImageError(`Failed to load image: ${imageUrl}`);
    };

    // 画像読み込み成功時のハンドラー
    const handleImageLoad = () => {
        console.log('Image loaded successfully:', imageUrl);
        setImageError(null);
    };

    if (process.env.ENVIRONMENT === 'production') {
        console.log('Final imageUrl:', imageUrl);
    }

    return (
        <div className="relative">
            <OptimizedImage
                src={imageUrl}
                alt={alt}
                width={width}
                height={height}
                className="object-cover rounded-lg"
                onLoad={handleImageLoad}
                onError={handleImageError}
            />
            {imageError && (
                <div className="absolute inset-0 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded flex items-center justify-center text-sm">
                    <div>
                        <strong>Image Error:</strong> {imageError}
                        <br />
                        <small>URL: {imageUrl}</small>
                    </div>
                </div>
            )}
        </div>
    );
} 