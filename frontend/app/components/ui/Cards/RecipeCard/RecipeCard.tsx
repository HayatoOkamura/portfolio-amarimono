"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { imageBaseUrl } from "@/app/utils/api";
import styles from "./RecipeCard.module.scss";
import { Recipe } from "@/app/types/index";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

interface RecipeCardProps {
  recipe: Recipe;
  isFavoritePage?: boolean;
  path: string;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  isLink?: boolean;
  href?: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavoritePage,
  path,
  className,
  size = 'medium',
  isLink = false,
  href,
}) => {
  const imageSrc = recipe.imageUrl
    ? `${imageBaseUrl}/${recipe.imageUrl}`
    : "/pic_recipe_default.webp";

  const cardContent = (
    <div className={`${styles.card_block} ${styles[`card_block--${size}`]} ${className || ''}`}>
      <div className={styles.card_block__img}>
        {recipe.isDraft && (
          <span className={styles.card_block__draft}>下書き</span>
        )}
        <OptimizedImage
          src={imageSrc}
          alt={recipe.name}
          width={100}
          height={100}
          priority={false}
          loading="lazy"
          sizes="(max-width: 768px) 50vw, 25vw"
        />
      </div>
      <div className={styles.card_block__contents}>
        <h2 className={styles.card_block__name}>{recipe.name}</h2>
      </div>
    </div>
  );

  // リンクが必要な場合はLinkコンポーネントでラップ
  if (isLink && href) {
    return (
      <Link href={href} className={styles.card_block__link}>
        {cardContent}
      </Link>
    );
  }

  // リンクが不要な場合は通常のdivを返す
  return cardContent;
};

export default RecipeCard;
