"use client";

import React from "react";
import styles from "./RecipeCreationIngredientCard.module.scss";
import { Ingredient } from "@/app/types/index";
import BaseIngredientCard from "../BaseIngredientCard/BaseIngredientCard";

export interface RecipeCreationIngredientCardProps {
  ingredient: Ingredient;
  isSelected: boolean;
  quantity: number;
  onQuantityChange: (id: number, delta: number) => void;
  onUnitChange?: (id: number, unit: string) => void;
  selectedUnit?: string;
}

const RecipeCreationIngredientCard: React.FC<RecipeCreationIngredientCardProps> = ({
  ingredient,
  isSelected,
  quantity,
  onQuantityChange,
  onUnitChange,
  selectedUnit,
}) => {
  const handleQuantityUpdate = (id: number, delta: number): void => {
    onQuantityChange(id, delta);
  };

  return (
    <BaseIngredientCard
      ingredient={ingredient}
      isSelected={isSelected}
      quantity={quantity}
      onQuantityChange={handleQuantityUpdate}
      onUnitChange={onUnitChange}
      selectedUnit={selectedUnit}
      isRecipeCreation={true}
      className={`${styles.ingredient_card} ${isSelected ? styles.selected : ""}`}
    />
  );
};

export default RecipeCreationIngredientCard; 