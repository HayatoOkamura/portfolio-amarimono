/* eslint-disable */
import type { Metadata } from "next";
import AdminRecipeNewClient from "./AdminRecipeNewClient";

export const metadata: Metadata = {
  title: "レシピ追加",
  description: "管理者専用のレシピ追加画面です。新しいレシピを登録し、材料、手順、栄養情報を設定できます。",
  keywords: ["レシピ追加", "管理者", "新規レシピ", "レシピ登録"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "レシピ追加",
    description: "管理者専用のレシピ追加画面です。新しいレシピを登録し、材料、手順、栄養情報を設定できます。",
    url: '/admin/recipes/new',
  },
  twitter: {
    title: "レシピ追加",
    description: "管理者専用のレシピ追加画面です。新しいレシピを登録し、材料、手順、栄養情報を設定できます。",
  },
};

export default function AdminRecipeNewPage() {
  return <AdminRecipeNewClient />;
} 