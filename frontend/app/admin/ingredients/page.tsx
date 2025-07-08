import type { Metadata } from "next";
import AdminIngredientsClient from "./AdminIngredientsClient";

export const metadata: Metadata = {
  title: "具材管理",
  description: "管理者専用の具材管理画面です。すべての具材の一覧、追加、編集、削除ができます。栄養情報も管理できます。",
  keywords: ["具材管理", "管理者", "具材追加", "具材編集", "具材削除", "栄養情報"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "具材管理",
    description: "管理者専用の具材管理画面です。すべての具材の一覧、追加、編集、削除ができます。栄養情報も管理できます。",
    url: '/admin/ingredients',
  },
  twitter: {
    title: "具材管理",
    description: "管理者専用の具材管理画面です。すべての具材の一覧、追加、編集、削除ができます。栄養情報も管理できます。",
  },
};

export default function AdminIngredientsPage() {
  return <AdminIngredientsClient />;
}
