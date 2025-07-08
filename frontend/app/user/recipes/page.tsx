/* eslint-disable */
import React from "react";
import type { Metadata } from "next";
import UserRecipesClient from "./UserRecipesClient";

export const metadata: Metadata = {
  title: "作成したレシピ",
  description: "あなたが作成したレシピの一覧を確認できます。レシピの編集、削除、公開設定の管理ができます。",
  keywords: ["作成レシピ", "マイレシピ", "レシピ管理", "レシピ編集", "レシピ削除"],
  openGraph: {
    title: "作成したレシピ",
    description: "あなたが作成したレシピの一覧を確認できます。レシピの編集、削除、公開設定の管理ができます。",
    url: '/user/recipes',
  },
  twitter: {
    title: "作成したレシピ",
    description: "あなたが作成したレシピの一覧を確認できます。レシピの編集、削除、公開設定の管理ができます。",
  },
};

export default function UserRecipesPage() {
  return <UserRecipesClient />;
}
