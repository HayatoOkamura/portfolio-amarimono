"use client";

import React from "react";
import styles from "./IngredientCard.module.scss";
import { backendUrl } from "@/app/utils/apiUtils";
import Image from "next/image";
import useUnitStep from "@/app/hooks/useUnitStep";

export interface IngredientCardProps {
  ingredient: {
    id: number;
    name: string;
    genre: {
      id: number;
      name: string;
    };
    unit: {
      id: number;
      name: string;
    };
    imageUrl?: string | null;
    quantity: number;
  };
  updateQuantity: (id: number, delta: number) => void;
}

const IngredientCard: React.FC<IngredientCardProps> = ({
  ingredient,
  updateQuantity,
}) => {
  const getStep = useUnitStep();
  const step = getStep(ingredient.unit.id);

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
          onClick={() => updateQuantity(ingredient.id, step)}
          aria-label={`Increase quantity of ${ingredient.name}`}
        >
          +
        </button>
        <span>
          {ingredient.quantity}
          {ingredient.unit.name}
        </span>
        <button
          onClick={() => updateQuantity(ingredient.id, -step)}
          aria-label={`Decrease quantity of ${ingredient.name}`}
        >
          -
        </button>
      </div>
    </li>
  );
};

export default IngredientCard;
