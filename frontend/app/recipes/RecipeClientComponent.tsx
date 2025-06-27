/* eslint-disable */
"use client";
import React from "react";
import { ResponsiveWrapper } from "../components/common/ResponsiveWrapper";
import RecipeClientComponentSP from "./RecipeClientComponentSP";
import RecipeClientComponentPC from "./RecipeClientComponentPC";

/**
 * RecipeClientComponent
 *
 * レシピ一覧と詳細を表示するメインコンポーネント
 * - スマートフォンとPCで表示を切り替え
 * - レシピの検索・表示
 * - レシピの詳細情報表示
 * - レシピのソート・フィルタリング
 * - アニメーション効果
 */
const RecipeClientComponent = () => {
  return (
    <ResponsiveWrapper 
      breakpoint="sp"
      renderBelow={<RecipeClientComponentSP />}
      renderAbove={<RecipeClientComponentPC />}
    >
      <RecipeClientComponentPC />
    </ResponsiveWrapper>
  );
};

export default RecipeClientComponent;
