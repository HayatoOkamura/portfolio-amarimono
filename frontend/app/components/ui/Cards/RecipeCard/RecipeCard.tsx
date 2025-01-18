"use client";
import React from "react";
import Image from "next/image";
import styles from "./RecipeCard.module.scss";

interface Ingredient {
  name: string;
  quantity: number;
}

interface Instruction {
  stepNumber: number;
  description: string;
}

interface RecipeCardProps {
  recipe: {
    name: string;
    genre: string;
    imageUrl?: string;
    ingredients: Ingredient[];
    instructions: Instruction[];
  };
}

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";

const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  return (
    <div className={styles.card_block}>
      <div className={styles.card_block__img}>
        <Image
          fill
          src={
            recipe.imageUrl
              ? `${backendUrl}/${recipe.imageUrl}`
              : "/default-image.jpg"
          }
          alt={recipe.name}
          unoptimized
        />
      </div>
      <div className={styles.card_block__contents}>
        <h2 className={styles.card_block__name}>{recipe.name}</h2>

        {/* 材料リスト */}
        <h3 className={styles.card_block__ingredients}>材料</h3>
        <ul className={styles.card_block__ing_list}>
          {recipe.ingredients.map((ingredient, idx) => (
            <li key={idx} className={styles.card_block__ing_item}>
              {ingredient.name} ({ingredient.quantity} 個)
            </li>
          ))}
        </ul>

        {/* 調理手順 */}
        <h3 className={styles.card_block__step}>調理手順</h3>
        <ol className={styles.card_block__step_list}>
          {recipe.instructions.map((step, idx) => (
            <li key={idx} className={styles.card_block__step_item}>
              <strong>Step {step.stepNumber}:</strong> {step.description}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
};

export default RecipeCard;
