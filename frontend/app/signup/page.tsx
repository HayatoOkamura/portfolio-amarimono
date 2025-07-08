import SignUp from "@/app/components/layout/Auth/SignUp/SignUp";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "新規登録",
  description: "あまりものに新規登録して、レシピ管理を始めましょう。簡単な手順でアカウントを作成できます。",
  keywords: ["新規登録", "アカウント作成", "サインアップ", "レシピ管理"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "新規登録",
    description: "あまりものに新規登録して、レシピ管理を始めましょう。簡単な手順でアカウントを作成できます。",
    url: '/signup',
  },
  twitter: {
    title: "新規登録",
    description: "あまりものに新規登録して、レシピ管理を始めましょう。簡単な手順でアカウントを作成できます。",
  },
};

export default function LoginPage() {
  return (
    <div>
      <h1>サインアップ</h1>
      <SignUp />
    </div>
  );
}
