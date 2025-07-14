"use client";

import React from "react";
import styles from "./RecipeCreationIngredientCard.module.scss";
import { Ingredient } from "@/app/types/index";
import BaseIngredientCard from "../BaseIngredientCard/BaseIngredientCard";
import { useUnits } from "@/app/hooks/units";
import { SUPPORTED_UNITS } from "@/app/utils/unitConversion";

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
  const selectedUnitData = units?.find(u => u.name === currentUnit);

  const handleQuantityUpdate = (id: number, delta: number): void => {
    if (!selectedUnitData) return;

    let step;
    if (selectedUnitData.type === "quantity" && selectedUnitData.step === 1) {
      step = 0.25; // stepが1の具材は0.25ずつ
    } else if (selectedUnitData.step === 50) {
      step = 10; // stepが50の具材は10ずつ
    } else {
      step = selectedUnitData.step; // その他の具材はstepの値そのまま
    }
    onQuantityChange(id, delta * step);
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

  // presence型具材の場合、対応可能な単位のみをフィルタリング
  const getAvailableUnits = () => {
    if (!units) return [];
    
    if (isPresenceType) {
      // presence型具材は対応可能な単位のみ選択可能
      return units.filter(unit => SUPPORTED_UNITS.includes(unit.name));
    }
    
    return units;
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
            {getAvailableUnits().map((unit) => (
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