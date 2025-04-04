"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import styles from "./RecipeCard.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import { Recipe } from "@/app/types/index";
import Link from "next/link";

interface RecipeCardProps {
  recipe: Recipe;
  isFavoritePage?: boolean;
  path: string;
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  isFavoritePage,
  path,
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
    <div className={styles.card_block}>
      <div className={styles.card_block__img}>
        {recipe.isDraft && (
          <span className={styles.card_block__draft}>下書き</span>
        )}
        <Image
          fill
          src={
            recipe.imageUrl
              ? `${backendUrl}/uploads/${recipe.imageUrl}`
              : "/pic_recipe_default.webp"
          }
          alt={recipe.name}
          unoptimized
        />
      </div>
      <div className={styles.card_block__contents}>
        <h2 className={styles.card_block__name}>{recipe.name}</h2>
      </div>
      {/* <p className={styles.card_block__genre}>
        ジャンル: <strong>{getGenreText()}</strong>
      </p>
      <h3 className={styles.card_block__ingredients}>材料</h3>
      <ul className={styles.card_block__ing_list}>
        {recipe.ingredients.map((ingredient, idx) => (
          <li key={idx} className={styles.card_block__ing_item}>
            {ingredient.name} ({ingredient.quantity} {ingredient.unit?.name})
          </li>
        ))}
      </ul>
      {isFavoritePage && recipe.id && (
        <Link href={`${path}${recipe.id}`}>
          <button className={styles.details_button}>詳しく見る</button>
        </Link>
      )} */}
    </div>
  );
};

export default RecipeCard;
