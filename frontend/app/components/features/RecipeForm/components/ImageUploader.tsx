"use client";
import React from "react";
import Image from "next/image";
import { toast } from "react-hot-toast";
import { useImageUpload } from "../hooks/useImageUpload";
import styles from "./ImageUploader.module.scss";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

interface ImageUploaderProps {
  imageUrl?: string;
  image?: File;
  onImageChange: (image: File) => void;
}

export const ImageUploader = ({ imageUrl, image, onImageChange }: ImageUploaderProps) => {
  const { handleImageChange, getImageUrl } = useImageUpload();
  const currentImageUrl = getImageUrl(imageUrl, image);
  

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast.error('画像サイズは10MB以下にしてください');
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
            <OptimizedImage
              src={currentImageUrl}
              alt="Current recipe"
              className={styles.imageUploader__image}
              width={500}
              height={500}
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
            <div className={styles.imageUploader__placeholderContent}>
              <span className={styles.imageUploader__placeholderText}>
                画像をアップロード
              </span>
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleChange}
              className={styles.imageUploader__input}
            />
          </div>
        )}
      </div>
    </div>
  );
}; 