"use client";

import React from 'react';
import { UserIngredientDefaults } from '@/app/components/features/UserIngredientDefaults/UserIngredientDefaults';
import styles from './page.module.scss';

export default function UserSettingsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>具材の初期設定</h1>
      <p className={styles.description}>
        よく使う具材の初期数量を設定できます。レシピ検索時に自動的に選択されます。
      </p>
      <UserIngredientDefaults />
    </div>
  );
} 