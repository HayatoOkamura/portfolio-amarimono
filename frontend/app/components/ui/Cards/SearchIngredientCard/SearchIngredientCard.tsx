"use client";

import React, { useEffect } from "react";
import styles from "./SearchIngredientCard.module.scss";
import { Ingredient } from "@/app/types/index";
import useIngredientStore from "@/app/stores/ingredientStore";
import BaseIngredientCard from "../BaseIngredientCard/BaseIngredientCard";

interface DefaultIngredient {
  ingredient_id: number;
  default_quantity: number;
}

export interface RecipeSearchIngredientCardProps {
  ingredient: Ingredient;
}

const RecipeSearchIngredientCard: React.FC<RecipeSearchIngredientCardProps> = ({
  ingredient,
}) => {
  const { addIngredient, removeIngredient, ingredients } = useIngredientStore();
  const isSelected = ingredients.some(
    (ing) => ing.id === ingredient.id && ing.quantity > 0
  );
  const isPresenceType = ingredient.unit.type === "presence";
  const currentQuantity = ingredients.find(ing => ing.id === ingredient.id)?.quantity || 0;

  // Cookieから初期値を読み込む
  useEffect(() => {
    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop()?.split(';').shift();
      return null;
    };

    const cookieData = getCookie('ingredient_defaults');
    if (cookieData) {
      try {
        const defaultIngredients = JSON.parse(decodeURIComponent(cookieData)) as DefaultIngredient[];
        const defaultIngredient = defaultIngredients.find(ing => ing.ingredient_id === ingredient.id);
        
        if (defaultIngredient && !isSelected) {
          const initialQuantity = isPresenceType ? 1 : defaultIngredient.default_quantity;
          addIngredient({
            ...ingredient,
            quantity: initialQuantity,
          });
        }
      } catch (error) {
        console.error('Error parsing cookie data:', error);
      }
    }
  }, [ingredient.id, isPresenceType, isSelected, addIngredient]);

  const handleQuantityUpdate = (id: number, delta: number): void => {
    if (isPresenceType) return;

    const newQuantity = Math.max(0, currentQuantity + delta * ingredient.unit.step);
    
    if (newQuantity > 0) {
      addIngredient({
        ...ingredient,
        quantity: newQuantity,
      });
    } else {
      removeIngredient(ingredient.id);
    }
  };

  return (
    <BaseIngredientCard
      ingredient={ingredient}
      isSelected={isSelected}
      quantity={currentQuantity}
      onQuantityChange={handleQuantityUpdate}
      isRecipeCreation={false}
      className={`${styles.ingredient_card} ${isSelected ? styles.selected : ""}`}
    />
  );
};

export default RecipeSearchIngredientCard;
