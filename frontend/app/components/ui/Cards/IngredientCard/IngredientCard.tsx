"use client";

import React, { useEffect } from "react";
import styles from "./IngredientCard.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
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
      updateQuantity({ ...ingredient, quantity: newQuantity });
    }
  };

  return (
    <li className={styles.card_block}>
      <div className={styles.card_block__image}>
        <Image
          fill
          src={
            ingredient.imageUrl
              ? `${backendUrl}/${ingredient.imageUrl}`
              : "/pic_recipe_default.webp"
          }
          alt={ingredient.name}
          unoptimized
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
          {currentQuantity}
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
