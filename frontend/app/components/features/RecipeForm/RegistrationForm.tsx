import React from "react";
import { ResponsiveWrapper } from "../../common/ResponsiveWrapper";
import { RegistrationFormPC } from "./RegistrationFormPC";
import { RegistrationFormSP } from "./RegistrationFormSP";
import { RecipeFormProps } from "./types/recipeForm";

/**
 * RegistrationForm
 *
 * レシピ登録フォームのメインコンポーネント
 * - スマートフォンとPCで表示を切り替え
 * - レシピの登録・編集機能
 * - 材料選択・管理機能
 * - 栄養素計算機能
 * - AI説明文生成機能
 */
export const RegistrationForm = ({
  isAdmin = false,
  initialRecipe,
}: RecipeFormProps) => {
  return (
    <ResponsiveWrapper 
      breakpoint="sp"
      renderBelow={<RegistrationFormSP isAdmin={isAdmin} initialRecipe={initialRecipe} />}
      renderAbove={<RegistrationFormPC isAdmin={isAdmin} initialRecipe={initialRecipe} />}
    >
      <RegistrationFormPC isAdmin={isAdmin} initialRecipe={initialRecipe} />
    </ResponsiveWrapper>
  );
};
