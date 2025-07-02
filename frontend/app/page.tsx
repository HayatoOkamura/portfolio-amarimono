import React from "react";
import styles from "./styles/HomePage.module.scss";
import { fetchIngredientsServer } from "./hooks/ingredients";
import HomePageClient from "./HomePageClient";

// 環境に応じてrevalidateの値を設定
const REVALIDATE_TIME = process.env.ENVIRONMENT === 'production' 
  ? (process.env.REVALIDATE_TIME ? parseInt(process.env.REVALIDATE_TIME, 10) : 86400) // 本番環境: 24時間
  : (process.env.REVALIDATE_TIME ? parseInt(process.env.REVALIDATE_TIME, 10) : 10);   // 開発環境: 10秒

// サーバーコンポーネントとしてrevalidateを設定
export const revalidate = REVALIDATE_TIME;

export default async function HomePage() {
  const initialIngredients = await fetchIngredientsServer();

  return (
    <div className={styles.wrapper}>
      <HomePageClient initialIngredients={initialIngredients} />
    </div>
  );
}
