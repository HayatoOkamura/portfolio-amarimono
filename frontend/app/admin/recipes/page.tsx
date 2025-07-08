/* eslint-disable */
import type { Metadata } from "next";
import AdminRecipesClient from "./AdminRecipesClient";

export const metadata: Metadata = {
  title: "レシピ管理",
  description: "管理者専用のレシピ管理画面です。すべてのレシピの一覧、編集、削除、公開設定の管理ができます。",
  keywords: ["レシピ管理", "管理者", "レシピ編集", "レシピ削除", "公開設定"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "レシピ管理",
    description: "管理者専用のレシピ管理画面です。すべてのレシピの一覧、編集、削除、公開設定の管理ができます。",
    url: '/admin/recipes',
  },
  twitter: {
    title: "レシピ管理",
    description: "管理者専用のレシピ管理画面です。すべてのレシピの一覧、編集、削除、公開設定の管理ができます。",
  },
};

export default function AdminRecipesPage() {
  return <AdminRecipesClient />;
}
