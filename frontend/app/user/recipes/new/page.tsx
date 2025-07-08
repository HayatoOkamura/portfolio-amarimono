/* eslint-disable */
import type { Metadata } from "next";
import RecipeRegistrationClient from "./RecipeRegistrationClient";

export const metadata: Metadata = {
  title: "レシピ登録",
  description: "新しいレシピを登録できます。材料、手順、栄養情報を入力してオリジナルレシピを作成しましょう。",
  keywords: ["レシピ登録", "新規レシピ", "レシピ作成", "オリジナルレシピ", "料理レシピ"],
  openGraph: {
    title: "レシピ登録",
    description: "新しいレシピを登録できます。材料、手順、栄養情報を入力してオリジナルレシピを作成しましょう。",
    url: '/user/recipes/new',
  },
  twitter: {
    title: "レシピ登録",
    description: "新しいレシピを登録できます。材料、手順、栄養情報を入力してオリジナルレシピを作成しましょう。",
  },
};

export default function RecipeRegistrationPage() {
  return <RecipeRegistrationClient />;
}
