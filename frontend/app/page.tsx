import React from "react";
import IngredientSelector from "./components/layout/IngredientSelector/IngredientSelector";
import GenerateRecipe from "./components/ui/GenerateRecipe/GenerateRecipe";
import styles from "./styles/HomePage.module.scss";
import { fetchIngredientsServer } from "./hooks/ingredients";
import HomePageClient from "./HomePageClient";

// 環境変数からrevalidateの値を取得（デフォルトは10秒）
const REVALIDATE_TIME = process.env.REVALIDATE_TIME ? parseInt(process.env.REVALIDATE_TIME, 10) : 10;

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
