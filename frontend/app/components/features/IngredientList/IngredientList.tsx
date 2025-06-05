import React from 'react';
import Image from 'next/image';
import { imageBaseUrl } from "@/app/utils/api";
import { EditIngredient } from "@/app/types/ingredient";
import styles from "./IngredientList.module.scss";

interface IngredientListProps {
  ingredients: EditIngredient[];
  onEdit: (ingredient: EditIngredient) => void;
  onDelete: (id: number) => void;
}

interface Ingredient {
  id: number;
  name: string;
  genre: { id: number; name: string };
  unit: { id: number; name: string; description: string; step: number };
  imageUrl?: string;
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbohydrates: number;
    salt: number;
  };
  gramEquivalent: number;
}

const IngredientList: React.FC<IngredientListProps> = ({
  ingredients,
  onEdit,
  onDelete,
}: IngredientListProps) => {
  return (
    <div className={styles.ingredientList}>
      {ingredients.map((ingredient) => (
        <div key={ingredient.id} className={styles.ingredientCard}>
          <div className={styles.ingredientImage}>
            {ingredient.imageUrl ? (
              <Image
                src={ingredient.imageUrl}
                alt={ingredient.name}
                width={100}
                height={100}
                className={styles.image}
              />
            ) : (
              <div className={styles.noImage}>No Image</div>
            )}
          </div>
          <div className={styles.ingredientInfo}>
            <h3 className={styles.name}>{ingredient.name}</h3>
            <div className={styles.details}>
              <p>ジャンル: {ingredient.genre.name}</p>
              <p>単位: {ingredient.unit.name}</p>
              <p>100g相当量: {ingredient.gramEquivalent}g</p>
              <div className={styles.nutrition}>
                <p>カロリー: {ingredient.nutrition.calories}kcal</p>
                <p>タンパク質: {ingredient.nutrition.protein}g</p>
                <p>脂質: {ingredient.nutrition.fat}g</p>
                <p>炭水化物: {ingredient.nutrition.carbohydrates}g</p>
                <p>塩分: {ingredient.nutrition.salt}g</p>
              </div>
            </div>
            <div className={styles.actions}>
              <button
                onClick={() => onEdit(ingredient)}
                className={styles.editButton}
              >
                編集
              </button>
              <button
                onClick={() => onDelete(ingredient.id)}
                className={styles.deleteButton}
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
