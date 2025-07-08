import React from "react";
import { Suspense } from "react";
import type { Metadata } from "next";
import Loading from "../components/ui/Loading/Loading";
import RecipeClientComponent from "./RecipeClientComponent";

export const metadata: Metadata = {
  title: "レシピ一覧",
  description: "家にある材料で作れる美味しいレシピを検索できます。具材を選択して、あなただけのレシピを見つけましょう。",
  keywords: ["レシピ一覧", "料理検索", "具材検索", "簡単レシピ", "家庭料理"],
  openGraph: {
    title: "レシピ一覧",
    description: "家にある材料で作れる美味しいレシピを検索できます。具材を選択して、あなただけのレシピを見つけましょう。",
    url: '/recipes',
  },
  twitter: {
    title: "レシピ一覧",
    description: "家にある材料で作れる美味しいレシピを検索できます。具材を選択して、あなただけのレシピを見つけましょう。",
  },
};

export default function RecipesPage() {
  return (
    <Suspense fallback={<Loading />}>
      <RecipeClientComponent />
    </Suspense>
  );
}
