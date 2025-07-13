"use client";

import React from 'react';
import { UserIngredientDefaults } from '@/app/components/features/UserIngredientDefaults/UserIngredientDefaults';
import styles from './page.module.scss';
import { withAuth } from '@/app/components/auth/withAuth';

function UserSettingsClient() {
  return (
    <div className={styles.container_block}>
      <h1 className={styles.container_block__title}>具材の初期設定</h1>
      <p className={styles.container_block__description}>
        よく使う具材の初期数量を設定できます。<br />レシピ検索時に自動的に選択されます。
      </p>
      <UserIngredientDefaults />
    </div>
  );
}

export default withAuth(UserSettingsClient); 