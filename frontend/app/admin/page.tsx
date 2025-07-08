import type { Metadata } from "next";
import AdminClient from "./AdminClient";

export const metadata: Metadata = {
  title: "管理者ダッシュボード",
  description: "管理者専用のダッシュボードです。レシピ、具材、ユーザーの管理ができます。",
  keywords: ["管理者", "ダッシュボード", "管理機能", "レシピ管理", "具材管理", "ユーザー管理"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "管理者ダッシュボード",
    description: "管理者専用のダッシュボードです。レシピ、具材、ユーザーの管理ができます。",
    url: '/admin',
  },
  twitter: {
    title: "管理者ダッシュボード",
    description: "管理者専用のダッシュボードです。レシピ、具材、ユーザーの管理ができます。",
  },
};

export default function AdminPage() {
  return <AdminClient />;
} 