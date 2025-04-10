import { useImageUpload } from "../hooks/useImageUpload";
import styles from "./ImageUploader.module.scss";

interface ImageUploaderProps {
  imageUrl?: string;
  image?: File;
  onImageChange: (image: File, imageUrl: string) => void;
}

export const ImageUploader = ({ imageUrl, image, onImageChange }: ImageUploaderProps) => {
  const { handleImageChange, getImageUrl } = useImageUpload();
  const currentImageUrl = getImageUrl(imageUrl, image);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const result = handleImageChange(e);
    if (result) {
      onImageChange(result.image, result.imageUrl);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        レシピ画像
      </label>
      <div className="relative">
        {currentImageUrl ? (
          <div className="relative group">
            <img
              src={currentImageUrl}
              alt="Current recipe"
              className="w-full h-64 object-cover rounded-lg"
              onError={(e) => {
                console.error("Image load error:", {
                  src: e.currentTarget.src,
                  imageUrl,
                  hasImage: !!image,
                });
              }}
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-300 flex items-center justify-center">
              <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                画像を変更
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <div className="space-y-1">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>画像をアップロード</span>
                </label>
                <p className="pl-1">またはドラッグ＆ドロップ</p>
              </div>
              <p className="text-xs text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 