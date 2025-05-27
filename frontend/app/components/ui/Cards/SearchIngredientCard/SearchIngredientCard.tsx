"use client";

import React, { useState } from "react";
import styles from "./SearchIngredientCard.module.scss";
import { Ingredient } from "@/app/types/index";
import useIngredientStore from "@/app/stores/ingredientStore";
import { useRouter } from "next/navigation";

interface DefaultIngredient {
  ingredient_id: number;
  default_quantity: number;
}

export interface IngredientCardProps {
  ingredient: Ingredient;
  isRecipeCreation?: boolean;
}

const SearchIngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  isRecipeCreation = false,
}) => {
  const router = useRouter();
  const { addIngredient, removeIngredient, ingredients } = useIngredientStore();
  const [quantity, setQuantity] = useState(0);

  const isSelected = ingredients.some(
    (ing) => ing.id === ingredient.id && ing.quantity > 0
  );
  const isPresenceType = ingredient.unit.type === "presence";

  //具材をlogで確認
  console.log(ingredient);

  const handleQuantityUpdate = (id: number, delta: number): void => {
    if (isPresenceType) return; // presenceタイプは数量変更不可

    const newQuantity = Math.max(0, quantity + delta * ingredient.unit.step);
    setQuantity(newQuantity);

    if (newQuantity > 0) {
      addIngredient({
        ...ingredient,
        quantity: newQuantity,
      });
    } else {
      removeIngredient(ingredient.id);
    }
  };

  const handleIngredientClick = () => {
    if (isSelected) {
      removeIngredient(ingredient.id);
      setQuantity(0);
    } else {
      if (quantity === 0 && !isPresenceType) return;

      const initialQuantity = isPresenceType ? 1 : ingredient.unit.step;
      addIngredient({
        ...ingredient,
        quantity: initialQuantity,
      });
      setQuantity(initialQuantity);
    }
  };

  const renderQuantityControls = () => {
    if (isPresenceType) {
      return (
        <div className={styles.ingredient_card__quantity}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleIngredientClick();
            }}
          >
            -
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSelected) {
                handleIngredientClick();
              }
            }}
            disabled={isSelected}
          >
            +
          </button>
        </div>
      );
    }

    return (
      <div className={styles.ingredient_card__quantity}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityUpdate(ingredient.id, -1);
          }}
          disabled={quantity <= 0}
        >
          -
        </button>
        <p>
          <span>{quantity}</span>
          <span>{ingredient.unit.name}</span>
        </p>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityUpdate(ingredient.id, 1);
          }}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <div
      className={`${styles.ingredient_card} ${
        isSelected ? styles.selected : ""
      }`}
    >
      <div className={styles.ingredient_card__image}>
        <img
          src={ingredient.imageUrl || "/pic_ingredient_default.webp"}
          alt={ingredient.name}
        />
      </div>
      <div className={styles.ingredient_card__content}>
        <h3 className={styles.ingredient_card__title}>{ingredient.name}</h3>
        {renderQuantityControls()}
      </div>
    </div>
  );
};

export default SearchIngredientCard;
