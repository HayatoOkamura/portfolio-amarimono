"use client";
import React from "react";
import { imageBaseUrl } from "@/app/utils/api";
import styles from "./IngredientList.module.scss";
import { Ingredient } from "@/app/types/index";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

interface IngredientListProps {
  ingredients: Ingredient[];
  onEdit: (ingredient: Ingredient) => void;
  onDelete: (id: number) => void;
}

const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onEdit,
  onDelete,
}: IngredientListProps) => {
  return (
    <div className={styles.ingredient_block}>
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className={styles.card_block}>
          <div className={styles.card_block__image}>
            {ingredient.imageUrl ? (
              <OptimizedImage
                src={
                  ingredient.imageUrl
                    ? `${imageBaseUrl}/${ingredient.imageUrl}`
                    : "/pic_ingredient_default.webp"
                }
                alt={ingredient.name}
                width={100}
                height={100}
                priority={false}
                loading="lazy"
                sizes="(max-width: 768px) 50vw, 25vw"
              />
            ) : (
              <div className={styles.noImage}>No Image</div>
            )}
          </div>
          <div className={styles.card_block__content}>
            <h3 className={styles.card_block__name}>{ingredient.name}</h3>
            <div className={styles.card_block__actions}>
              <button
                onClick={() => onEdit(ingredient)}
                className={styles.card_block__edit}
              >
                編集
              </button>
              <button
                onClick={() => onDelete(ingredient.id)}
                className={styles.card_block__delete}
              >
                削除
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default IngredientList;
