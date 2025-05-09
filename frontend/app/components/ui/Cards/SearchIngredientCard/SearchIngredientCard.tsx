"use client";

import React, { useEffect } from "react";
import styles from "./SearchIngredientCard.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import { Unit } from "@/app/types/index";
import Image from "next/image";
import useIngredientStore from "@/app/stores/ingredientStore";
import { useUpdateIngredientQuantity } from "@/app/hooks/ingredients";

export interface IngredientCardProps {
  ingredient: {
    id: number;
    name: string;
    genre: {
      id: number;
      name: string;
    };
    unit: Unit
    imageUrl?: string | null;
    quantity: number;
  };
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
}) => {
  const { mutate: updateQuantity } = useUpdateIngredientQuantity();
  const ingredients = useIngredientStore((state) => state.ingredients);
  const currentIngredient = ingredients.find(i => i.id === ingredient.id);
  const currentQuantity = currentIngredient?.quantity || 0;
  
  const handleQuantityUpdate = (id: number, delta: number) => {
    const newQuantity = Math.max(0, currentQuantity + delta);
    if (newQuantity > 0 || currentQuantity > 0) {
      updateQuantity({ 
        ...ingredient, 
        quantity: newQuantity, 
        imageUrl: ingredient.imageUrl || null,
        nutrition: currentIngredient?.nutrition || {
          calories: 0,
          carbohydrates: 0,
          fat: 0,
          protein: 0,
          salt: 0
        }
      });
    }
  };

  return (
    <li className={styles.card_block}>
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
          onClick={() => handleQuantityUpdate(ingredient.id, ingredient.unit.step)}
          aria-label={`Increase quantity of ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles['card_block__button--plus']}`}
        />

        <span>
          {Number.isInteger(currentQuantity) ? currentQuantity : Number(currentQuantity).toFixed(1)}
          {ingredient.unit.name}
        </span>
        <button
          onClick={() => handleQuantityUpdate(ingredient.id, -ingredient.unit.step)}
          aria-label={`Decrease quantity of ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles["card_block__button--minus"]}`}
        />
      </div>
    </li>
  );
};

export default IngredientCard;
