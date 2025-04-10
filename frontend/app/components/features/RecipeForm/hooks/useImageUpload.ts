import { useCallback } from "react";
import { backendUrl } from "@/app/utils/apiUtils";

export const useImageUpload = () => {
  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      return {
        image: file,
        imageUrl: previewUrl,
      };
    }
    return null;
  }, []);

  const getImageUrl = useCallback((imageUrl?: string, image?: File) => {
    if (image) {
      return URL.createObjectURL(image);
    }
    if (imageUrl) {
      return imageUrl.startsWith("http") ? imageUrl : `${backendUrl}/uploads/${imageUrl}`;
    }
    return undefined;
  }, []);

  const revokeImageUrl = useCallback((imageUrl: string) => {
    if (imageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(imageUrl);
    }
  }, []);

  return {
    handleImageChange,
    getImageUrl,
    revokeImageUrl,
  };
}; 