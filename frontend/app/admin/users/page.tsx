import type { Metadata } from "next";
import AdminUsersClient from "./AdminUsersClient";

export const metadata: Metadata = {
  title: "ユーザー管理",
  description: "管理者専用のユーザー管理画面です。すべてのユーザーの一覧、権限設定、ロール管理ができます。",
  keywords: ["ユーザー管理", "管理者", "権限設定", "ロール管理", "ユーザー一覧"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "ユーザー管理",
    description: "管理者専用のユーザー管理画面です。すべてのユーザーの一覧、権限設定、ロール管理ができます。",
    url: '/admin/users',
  },
  twitter: {
    title: "ユーザー管理",
    description: "管理者専用のユーザー管理画面です。すべてのユーザーの一覧、権限設定、ロール管理ができます。",
  },
};

export default function AdminUsersPage() {
  return <AdminUsersClient />;
} 