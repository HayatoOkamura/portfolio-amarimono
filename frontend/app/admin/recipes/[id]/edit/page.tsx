/* eslint-disable */
import type { Metadata } from "next";
import AdminRecipeEditClient from "./AdminRecipeEditClient";

export const metadata: Metadata = {
  title: "レシピ編集",
  description: "管理者専用のレシピ編集画面です。レシピの情報、材料、手順、栄養情報を編集できます。",
  keywords: ["レシピ編集", "管理者", "レシピ更新", "レシピ修正"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "レシピ編集",
    description: "管理者専用のレシピ編集画面です。レシピの情報、材料、手順、栄養情報を編集できます。",
    url: '/admin/recipes/[id]/edit',
  },
  twitter: {
    title: "レシピ編集",
    description: "管理者専用のレシピ編集画面です。レシピの情報、材料、手順、栄養情報を編集できます。",
  },
};

export default function AdminRecipeEditPage() {
  return <AdminRecipeEditClient />;
} 