"use client";

import React from "react";
import Image from "next/image";
import styles from "./IngredientCard.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import { Ingredient } from "@/app/types/index";

interface IngredientCardProps {
  ingredient: Ingredient;
  isRecipeCreation?: boolean;
  onQuantityChange?: (id: number, delta: number) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  isRecipeCreation = false,
  onQuantityChange
}) => {
  const isPresenceType = ingredient.unit.type === "presence";
  const isSeasoningType = ['大さじ', '小さじ', '適量', '少々', 'ひとつまみ'].includes(ingredient.unit.name);
  const isSelected = ingredient.quantity > 0;

  const handleQuantityUpdate = (delta: number) => {
    if (!onQuantityChange) return;
    if (isPresenceType) return; // presenceタイプは数量変更不可
    
    if (isRecipeCreation) {
      // レシピ作成時は調味料も数量変更可能
      onQuantityChange(ingredient.id, delta);
    } else if (!isSeasoningType) {
      // レシピ検索時は調味料以外のみ数量変更可能
      onQuantityChange(ingredient.id, delta);
    }
  };

  const renderQuantityControls = () => {
    if (isPresenceType) {
      return <span className={styles.card_block__unit}>{ingredient.unit.name}</span>;
    }

    if (isSeasoningType && !isRecipeCreation) {
      return <span className={styles.card_block__unit}>{ingredient.unit.name}</span>;
    }

    return (
      <div className={styles.card_block__controls}>
        <button
          onClick={() => handleQuantityUpdate(-1)}
          disabled={ingredient.quantity <= 1}
          className={`${styles.card_block__button} ${styles['card_block__button--minus']}`}
        >
          -
        </button>
        <span>
          {Number.isInteger(ingredient.quantity) ? ingredient.quantity : Number(ingredient.quantity).toFixed(1)}
        </span>
        <button
          onClick={() => handleQuantityUpdate(1)}
          className={`${styles.card_block__button} ${styles['card_block__button--plus']}`}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <li className={`${styles.card_block} ${isSelected ? styles['card_block--selected'] : ''}`}>
      <div className={styles.card_block__image}>
        <Image
          src={
            ingredient.imageUrl
              ? `${imageBaseUrl}/${ingredient.imageUrl}`
              : "/pic_ingredient_default.webp"
          }
          alt={ingredient.name}
          width={100}
          height={100}
        />
      </div>
      <p className={styles.card_block__name}>{ingredient.name}</p>
      {renderQuantityControls()}
    </li>
  );
};

export default IngredientCard; 