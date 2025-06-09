"use client";

import React from "react";
import Image from "next/image";
import styles from "./BaseIngredientCard.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import { Ingredient } from "@/app/types/index";
import { useUnits } from "@/app/hooks/units";

export interface BaseIngredientCardProps {
  ingredient: Ingredient;
  isSelected?: boolean;
  quantity?: number;
  onQuantityChange?: (id: number, delta: number) => void;
  onUnitChange?: (id: number, unit: string, callback?: () => void) => void;
  selectedUnit?: string;
  isRecipeCreation?: boolean;
  className?: string;
  onClick?: () => void;
}

const BaseIngredientCard: React.FC<BaseIngredientCardProps> = ({
  ingredient,
  isSelected = false,
  quantity = 0,
  onQuantityChange,
  onUnitChange,
  selectedUnit,
  isRecipeCreation = false,
  className = "",
  onClick,
}) => {
  const { data: units } = useUnits();
  const isPresenceType = ingredient.unit.type === "presence";
  const isQuantityTypeWithStep1 = ingredient.unit.type === "quantity" && ingredient.unit.step === 1;

  const handleQuantityUpdate = (delta: number) => {
    if (!onQuantityChange) return;
    onQuantityChange(ingredient.id, delta);
  };

  const formatQuantity = (qty: number) => {
    if (!isRecipeCreation || !isQuantityTypeWithStep1) {
      return Number.isInteger(qty) ? qty : Number(qty).toFixed(1);
    }
    return Number.isInteger(qty) ? qty : Number(qty).toFixed(1);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!onUnitChange) return;
    const newUnit = units?.find((unit) => unit.name === e.target.value);
    if (newUnit) {

      // 単位変更を実行（数量リセットは親コンポーネントで処理）
      onUnitChange(ingredient.id, newUnit.name);
    }
  };

  const renderQuantityControls = () => {
    const currentUnit = selectedUnit || ingredient.unit.name;
    const isCurrentUnitAdjustable = ["大さじ", "小さじ", "滴"].includes(currentUnit);

    if (isPresenceType && !isRecipeCreation) {
      return (
        <div className={styles.card_block__controls}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityUpdate(-1);
            }}
            disabled={!isSelected}
            className={`${styles.card_block__button} ${styles["card_block__button--minus"]}`}
          >
            -
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleQuantityUpdate(1);
            }}
            disabled={isSelected}
            className={`${styles.card_block__button} ${styles["card_block__button--plus"]}`}
          >
            +
          </button>
        </div>
      );
    }

    return (
      <div className={styles.card_block__controls}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityUpdate(-1);
          }}
          disabled={
            isPresenceType && !isCurrentUnitAdjustable
              ? !isSelected
              : quantity <= 0
          }
          className={`${styles.card_block__button} ${styles["card_block__button--minus"]}`}
        >
          -
        </button>
        {(!isPresenceType || isCurrentUnitAdjustable || isRecipeCreation) && (
          <span>
            {formatQuantity(quantity)}
            {currentUnit}
          </span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleQuantityUpdate(1);
          }}
          disabled={
            isPresenceType && !isCurrentUnitAdjustable ? isSelected : false
          }
          className={`${styles.card_block__button} ${styles["card_block__button--plus"]}`}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <li
      className={`${styles.card_block} ${
        isSelected ? styles["card_block--selected"] : ""
      } ${className}`}
      onClick={onClick}
    >
      <div className={styles.card_block__image}>
        <Image
          src={
            ingredient.imageUrl
              ? `${imageBaseUrl}/${ingredient.imageUrl}`
              : "/pic_ingredient_default.webp"
          }
          alt={ingredient.name}
          width={100}
          height={100}
        />
      </div>
      <div className={styles.card_block__contents}>
        <p className={styles.card_block__name}>{ingredient.name}</p>
        {renderQuantityControls()}
      </div>
    </li>
  );
};

export default BaseIngredientCard;
