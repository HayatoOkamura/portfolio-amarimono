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
        if (process.env.ENVIRONMENT === 'production') {
            return `${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/${src}`;
        } else {
            return `${process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL}/${src}`;
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