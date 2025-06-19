"use client";

import React from 'react';
import styles from './InitialSettingsStep.module.scss';
import { useRouter } from 'next/navigation';
import { useUpdateUserIngredientDefaults, useUpdateIngredientDefaults } from '@/app/hooks/userIngredientDefaults';
import { useIngredients } from '@/app/hooks/ingredients';
import { useAuth } from '@/app/hooks/useAuth';
import useIngredientStore from '@/app/stores/ingredientStore';
import { useUpdateIngredientQuantity } from '@/app/hooks/ingredients';

interface InitialSettingsStepProps {
  onComplete: () => void;
}

export const InitialSettingsStep: React.FC<InitialSettingsStepProps> = ({ onComplete }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { mutate: updateUserDefaults } = useUpdateUserIngredientDefaults();
  const { mutate: updateDefaults } = useUpdateIngredientDefaults();
  const { data: ingredients } = useIngredients();
  const { mutate: updateQuantity } = useUpdateIngredientQuantity();

  const handleYes = async () => {
    if (!ingredients) return;

    // 調味料（genre_id: 5）とスパイス（genre_id: 6）の具材を全て選択
    const seasoningIngredients = ingredients.filter(ing => ing.genre.id === 5 || ing.genre.id === 6);
    const updates = seasoningIngredients.map(ing => ({
      ingredient_id: ing.id,
      default_quantity: 1
    }));

    if (user) {
      // 認証済みユーザーの場合
      await updateUserDefaults(updates);
    } else {
      // 未認証ユーザーの場合
      await updateDefaults(updates);
    }

    // 具材ストアを即座に更新
    seasoningIngredients.forEach(ingredient => {
      updateQuantity({
        ...ingredient,
        quantity: 1,
        imageUrl: ingredient.imageUrl || null,
        nutrition: ingredient.nutrition || {
          calories: 0,
          carbohydrates: 0,
          fat: 0,
          protein: 0,
          salt: 0
        }
      });
    });

    onComplete();
  };

  const handleNo = () => {
    onComplete();
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>初期設定</h1>
      <p className={styles.message}>
        調味料とスパイスは最初から選択済みにしますか？
      </p>
      <div className={styles.buttons}>
        <button
          onClick={handleYes}
          className={`${styles.button} ${styles.button__yes}`}
        >
          はい
        </button>
        <button
          onClick={handleNo}
          className={`${styles.button} ${styles.button__no}`}
        >
          いいえ
        </button>
      </div>
    </div>
  );
}; 