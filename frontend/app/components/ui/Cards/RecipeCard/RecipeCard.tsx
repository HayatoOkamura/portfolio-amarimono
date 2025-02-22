"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import styles from "./RecipeCard.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import Link from "next/link";

interface Ingredient {
  name: string;
  quantity: number;
  unit: {
    id: number;
    name: string;
  };
}

interface Genre {
  id: number;
  name: string;
}

interface RecipeCardProps {
  recipe: {
    id?: string | number;
    name: string;
    genre: Genre;
    imageUrl?: string;
    ingredients: Ingredient[];
  };
  isFavoritePage?: boolean;
}


const RecipeCard: React.FC<RecipeCardProps> = ({ recipe, isFavoritePage }) => {
  useEffect(() => {
    console.log("テスト", recipe);
  }, [recipe]);
  return (
    <div className={styles.card_block}>
      <div className={styles.card_block__img}>
        <Image
          fill
          src={
            recipe.imageUrl
              ? `${backendUrl}/uploads/${recipe.imageUrl}`
              : "/default-image.jpg"
          }
          alt={recipe.name}
          unoptimized
        />
      </div>
      <div className={styles.card_block__contents}>
        <h2 className={styles.card_block__name}>{recipe.name}</h2>
        {/* ジャンル */}
        <p className={styles.card_block__genre}>
          ジャンル: <strong>{recipe.genre.name}</strong>{" "}
          {/* 修正: genre.name を表示 */}
        </p>

        {/* 材料リスト */}
        <h3 className={styles.card_block__ingredients}>材料</h3>
        <ul className={styles.card_block__ing_list}>
          {recipe.ingredients.map((ingredient, idx) => (
            <li key={idx} className={styles.card_block__ing_item}>
              {ingredient.name} ({ingredient.quantity} {ingredient.unit?.name})
            </li>
          ))}
        </ul>

         {/* ✅ 詳しく見るボタン（お気に入りページ限定） */}
         {isFavoritePage && recipe.id && (
          <Link href={`/recipes/${recipe.id}`}>
            <button className={styles.details_button}>詳しく見る</button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default RecipeCard;
