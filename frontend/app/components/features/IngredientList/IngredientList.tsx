import React from "react";
import Image from "next/image";
import { imageBaseUrl } from "@/app/utils/api";
import { Ingredient } from "@/app/types/index";
import styles from "./IngredientList.module.scss";

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
              <Image
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
            {/* <div className={styles.card_block__details}>
              <div className={styles.card_block__info}>
                <p>ジャンル: {ingredient.genre.name}</p>
                <p>単位: {ingredient.unit.name}</p>
                <p>100g相当量: {ingredient.gramEquivalent}g</p>
              </div>
              <div className={styles.card_block__info}>
                <p>カロリー: {ingredient.nutrition.calories}kcal</p>
                <p>タンパク質: {ingredient.nutrition.protein}g</p>
                <p>脂質: {ingredient.nutrition.fat}g</p>
                <p>炭水化物: {ingredient.nutrition.carbohydrates}g</p>
                <p>塩分: {ingredient.nutrition.salt}g</p>
              </div>
            </div> */}
            <div className={styles.card_block__actions}>
              <button
                onClick={() => onEdit(ingredient)}
                className={styles.card_block__button}
              >
                編集
              </button>
              <button
                onClick={() => onDelete(ingredient.id)}
                className={styles.card_block__button}
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
