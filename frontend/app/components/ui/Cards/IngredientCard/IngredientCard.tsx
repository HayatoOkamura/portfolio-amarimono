"use client";

import React from "react";
import styles from "./IngredientCard.module.scss";
import Image from "next/image";

export interface IngredientCardProps {
  ingredient: {
    id: number;
    name: string;
    genre: {
      id: number;
      name: string;
    };
    imageUrl?: string | null;
    quantity: number;
  };
  increaseQuantity: (id: number) => void;
  decreaseQuantity: (id: number) => void;
}

const backendUrl =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
  

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  increaseQuantity,
  decreaseQuantity,
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
          onClick={() => increaseQuantity(ingredient.id)}
          aria-label={`Increase quantity of ${ingredient.name}`}
        >
          +
        </button>
        <span>{ingredient.quantity}</span>
        <button
          onClick={() => decreaseQuantity(ingredient.id)}
          aria-label={`Decrease quantity of ${ingredient.name}`}
        >
          -
        </button>
      </div>
    </li>
  );
};

export default IngredientCard;
