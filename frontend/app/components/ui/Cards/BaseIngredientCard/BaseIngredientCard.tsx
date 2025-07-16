"use client";

import React from "react";
import Image from "next/image";
import styles from "./BaseIngredientCard.module.scss";
import { imageBaseUrl } from "@/app/utils/api";
import { Ingredient } from "@/app/types/index";
import { useUnits } from "@/app/hooks/units";
import { PRESENCE_UNITS } from "@/app/utils/unitConversion";
import { useIntersectionObserver } from "@/app/hooks/useIntersectionObserver";
import { INGREDIENT_BLUR_PLACEHOLDER } from "@/app/utils/imageUtils";

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
  isPriority?: boolean;
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
  isPriority = false,
}) => {
  const { data: units } = useUnits();
  const isPresenceType = ingredient.unit.type === "presence";
  const isQuantityTypeWithStep1 = ingredient.unit.type === "quantity" && ingredient.unit.step === 1;
  
  // Intersection Observerを使用して遅延読み込みを最適化
  const { elementRef, hasIntersected } = useIntersectionObserver<HTMLLIElement>({
    threshold: 0.1,
    rootMargin: '100px',
  });

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

  const renderQuantityControls = () => {
    const currentUnit = selectedUnit || ingredient.unit.name;
    const selectedUnitData = units?.find(u => u.name === currentUnit);
    const isCurrentUnitAdjustable = !isPresenceType || 
      (selectedUnitData?.type !== "presence") || 
      ["大さじ", "小さじ", "滴"].includes(currentUnit);

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
            aria-label={`${ingredient.name}を選択解除`}
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
            aria-label={`${ingredient.name}を選択`}
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
          aria-label={`${ingredient.name}の数量を減らす`}
        >
          -
        </button>
        {(!isPresenceType || isCurrentUnitAdjustable || isRecipeCreation) && (
          <span aria-label={`${ingredient.name}の数量: ${formatQuantity(quantity)}${currentUnit}`}>
            {PRESENCE_UNITS.includes(currentUnit as typeof PRESENCE_UNITS[number])
              ? currentUnit
              : currentUnit === "大さじ" || currentUnit === "小さじ"
                ? `${currentUnit}${formatQuantity(quantity)}`
                : `${formatQuantity(quantity)}${currentUnit}`}
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
          aria-label={`${ingredient.name}の数量を増やす`}
        >
          +
        </button>
      </div>
    );
  };

  return (
    <li
      ref={elementRef}
      className={`${styles.card_block} ${
        isSelected ? styles["card_block--selected"] : ""
      } ${className}`}
      onClick={onClick}
      role="gridcell"
      aria-selected={isSelected}
    >
      <div className={styles.card_block__image}>
        {(isPriority || hasIntersected) && (
          <Image
            src={
              ingredient.imageUrl
                ? `${imageBaseUrl}/${ingredient.imageUrl}`
                : "/pic_ingredient_default.webp"
            }
            alt={ingredient.name}
            width={100}
            height={100}
            priority={isPriority}
            loading={isPriority ? "eager" : "lazy"}
            sizes="100px"
            quality={75}
            placeholder="blur"
            blurDataURL={INGREDIENT_BLUR_PLACEHOLDER}
          />
        )}
        {!isPriority && !hasIntersected && (
          <div className={styles.card_block__image__placeholder}>
            読み込み中...
          </div>
        )}
      </div>
      <div className={styles.card_block__contents}>
        <p className={styles.card_block__name}>{ingredient.name}</p>
        {renderQuantityControls()}
      </div>
    </li>
  );
};

export default BaseIngredientCard;
