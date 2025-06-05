"use client";

import React from "react";
import styles from "./RecipeCreationIngredientCard.module.scss";
import { Ingredient } from "@/app/types/index";
import BaseIngredientCard from "../BaseIngredientCard/BaseIngredientCard";
import { useUnits } from "@/app/hooks/units";

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
  const { data: units } = useUnits();
  const isPresenceType = ingredient.unit.type === "presence";
  const currentUnit = selectedUnit || ingredient.unit.name;

  const handleQuantityUpdate = (id: number, delta: number): void => {
    onQuantityChange(id, delta);
  };

  const handleUnitChange = (id: number, unit: string, callback?: () => void): void => {
    if (!onUnitChange) return;
    onUnitChange(id, unit);
    if (callback) callback();
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUnit = units?.find((unit) => unit.name === e.target.value);
    if (newUnit) {
      handleUnitChange(ingredient.id, newUnit.name);
    }
  };

  return (
    <div className={styles.ingredient_card_block}>
      <BaseIngredientCard
        ingredient={ingredient}
        isSelected={isSelected}
        quantity={quantity}
        onQuantityChange={handleQuantityUpdate}
        onUnitChange={handleUnitChange}
        selectedUnit={currentUnit}
        isRecipeCreation={true}
        className={`${styles.ingredient_card} ${isSelected ? styles.selected : ""}`}
      />
      {isPresenceType && (
        <div className={styles.ingredient_card_block__unit_selector}>
          <select
            value={currentUnit}
            onChange={handleSelectChange}
            className={styles.ingredient_card_block__unit_select}
            onClick={(e) => e.stopPropagation()}
          >
            {units
              ?.filter((unit) => unit.type === "presence")
              .map((unit) => (
                <option key={unit.id} value={unit.name}>
                  {unit.name}
                </option>
              ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default RecipeCreationIngredientCard; 