/* eslint-disable */
import type { Metadata } from "next";
import AdminRecipeDetailClient from "./AdminRecipeDetailClient";

export const metadata: Metadata = {
  title: "レシピ詳細",
  description: "管理者専用のレシピ詳細画面です。レシピの詳細情報、編集、削除、公開設定の管理ができます。",
  keywords: ["レシピ詳細", "管理者", "レシピ編集", "レシピ削除", "公開設定"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "レシピ詳細",
    description: "管理者専用のレシピ詳細画面です。レシピの詳細情報、編集、削除、公開設定の管理ができます。",
    url: '/admin/recipes/[id]',
  },
  twitter: {
    title: "レシピ詳細",
    description: "管理者専用のレシピ詳細画面です。レシピの詳細情報、編集、削除、公開設定の管理ができます。",
  },
};

export default function AdminRecipeDetailPage() {
  return <AdminRecipeDetailClient />;
} 