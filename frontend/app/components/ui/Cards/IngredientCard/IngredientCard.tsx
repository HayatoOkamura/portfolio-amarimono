"use client";

import React from "react";
import styles from "./IngredientCard.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import { Unit } from "@/app/types";
import Image from "next/image";

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
  updateQuantity: (id: number, delta: number) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  updateQuantity,
}) => {
  return (
    <li className={styles.card_block}>
      <div className={styles.card_block__image}>
        <Image
          fill
          src={
            ingredient.imageUrl
              ? `${backendUrl}/${ingredient.imageUrl}`
              : "/default-image.jpg"
          }
          alt={ingredient.name}
          unoptimized
        />
      </div>
      <p className={styles.card_block__name}>{ingredient.name}</p>
      <p className={styles.card_block__genre}>{ingredient.genre.name}</p>
      <div className={styles.card_block__controls}>
        <button
          onClick={() => updateQuantity(ingredient.id, ingredient.unit.step)}
          aria-label={`Increase quantity of ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles['card_block__button--plus']}`}
        />

        <span>
          {ingredient.quantity}
          {ingredient.unit.name}
        </span>
        <button
          onClick={() => updateQuantity(ingredient.id, -ingredient.unit.step)}
          aria-label={`Decrease quantity of ${ingredient.name}`}
          className={`${styles.card_block__button} ${styles["card_block__button--minus"]}`}
        />
      </div>
    </li>
  );
};

export default IngredientCard;
