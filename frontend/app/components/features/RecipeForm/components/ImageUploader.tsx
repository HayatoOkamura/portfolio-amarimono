import { useImageUpload } from "../hooks/useImageUpload";
import { LuImagePlus } from "react-icons/lu";
import styles from "./ImageUploader.module.scss";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploaderProps {
  imageUrl?: string;
  image?: File;
  onImageChange: (image: File) => void;
}

export const ImageUploader = ({ imageUrl, image, onImageChange }: ImageUploaderProps) => {
  const { handleImageChange, getImageUrl } = useImageUpload();
  const currentImageUrl = getImageUrl(imageUrl, image);

  console.log("currentImageUrl", currentImageUrl);
  

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      alert('画像サイズは10MB以下にしてください');
      return;
    }

    const result = await handleImageChange(e);
    if (result) {
      onImageChange(result.image);
    }
  };

  return (
    <div className={styles.imageUploader}>
      <div className={styles.imageUploader__container}>
        {currentImageUrl ? (
          <div className={styles.imageUploader__imageContainer}>
            <img
              src={currentImageUrl}
              alt="Current recipe"
              className={styles.imageUploader__image}
              onError={(e) => {
                console.error("Image load error:", {
                  src: e.currentTarget.src,
                  imageUrl,
                  hasImage: !!image,
                });
              }}
            />
            <div className={styles.imageUploader__overlay}>
              <span className={styles.imageUploader__overlayText}>
                画像を変更
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className={styles.imageUploader__input}
            />
          </div>
        ) : (
          <div className={styles.imageUploader__placeholder}>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className={styles.imageUploader__input}
            />
            <div className={styles.imageUploader__placeholderContent}>
              <div className={styles.imageUploader__icon}>
                <LuImagePlus />
              </div>
              <div className={styles.imageUploader__uploadText}>
                <label className={styles.imageUploader__uploadLabel}>
                  料理の画像をアップロード
                </label>
              </div>
              <p className={styles.imageUploader__fileInfo}>
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 