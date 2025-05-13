"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { imageBaseUrl } from "@/app/utils/api";
import styles from "./RecipeCard.module.scss";
import { backendUrl } from "@/app/utils/api";
import { Recipe } from "@/app/types/index";
import Link from "next/link";

interface RecipeCardProps {
  recipe: Recipe;
  isFavoritePage?: boolean;
  path: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavoritePage,
  path,
  className,
  size = 'medium',
}) => {
  // ジャンル表示用の文字列を取得
  const getGenreText = () => {
    if (!recipe.genre) return "すべて";
    if (typeof recipe.genre === "string") return recipe.genre;

    // genre.nameがオブジェクトの場合
    if (typeof recipe.genre.name === "object" && "name" in recipe.genre.name) {
      const genreName = recipe.genre.name as { name: string };
      return genreName.name;
    }

    // genre.nameが文字列の場合
    if (typeof recipe.genre.name === "string") {
      return recipe.genre.name;
    }

    return "すべて";
  };

  return (
    <div className={`${styles.card_block} ${styles[`card_block--${size}`]} ${className || ''}`}>
      <div className={styles.card_block__img}>
        {recipe.isDraft && (
          <span className={styles.card_block__draft}>下書き</span>
        )}
        <Image
          src={
            recipe.imageUrl
              ? `${imageBaseUrl}/${recipe.imageUrl}`
              : "/pic_recipe_default.webp"
          }
          alt={recipe.name}
          width={100}
          height={100}
        />
      </div>
      <div className={styles.card_block__contents}>
        <h2 className={styles.card_block__name}>{recipe.name}</h2>
      </div>
    </div>
  );
};

export default RecipeCard;
