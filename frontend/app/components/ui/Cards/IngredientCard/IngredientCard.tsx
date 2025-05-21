"use client";

import React from "react";
import Image from "next/image";
import styles from "./IngredientCard.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import { Ingredient } from "@/app/types/index";

export interface IngredientCardProps {
  ingredient: Ingredient;
  currentQuantity: number;
  isPresence: boolean;
  onQuantityChange: (id: number, delta: number) => void;
  className?: string;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  currentQuantity,
  isPresence,
  onQuantityChange,
  className = ""
}) => {
  const isSelected = currentQuantity > 0;

  return (
    <li className={`${styles.card_block} ${isSelected ? styles['card_block--selected'] : ''} ${className}`}>
      <div className={styles.card_block__image}>
        <Image
          src={
            ingredient.imageUrl
              ? `${imageBaseUrl}/${ingredient.imageUrl}`
              : "/pic_recipe_default.webp"
          }
          alt={ingredient.name}
          width={100}
          height={100}
        />
      </div>
      <p className={styles.card_block__name}>{ingredient.name}</p>
      <div className={styles.card_block__controls}>
        <button
          onClick={() => onQuantityChange(ingredient.id, ingredient.unit.step)}
          aria-label={`${isPresence ? 'Select' : 'Increase quantity of'} ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles['card_block__button--plus']} ${
            isPresence && isSelected ? styles['card_block__button--disabled'] : ''
          }`}
          disabled={isPresence && isSelected}
        />

        {!isPresence && (
          <span>
            {Number.isInteger(currentQuantity) ? currentQuantity : Number(currentQuantity).toFixed(1)}
            {ingredient.unit.name}
          </span>
        )}
        <button
          onClick={() => onQuantityChange(ingredient.id, -ingredient.unit.step)}
          aria-label={`Decrease quantity of ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles["card_block__button--minus"]} ${
            !isSelected ? styles['card_block__button--disabled'] : ''
          }`}
          disabled={!isSelected}
        />
      </div>
    </li>
  );
};

export default IngredientCard; 