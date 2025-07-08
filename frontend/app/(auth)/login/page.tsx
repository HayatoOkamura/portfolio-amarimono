import type { Metadata } from "next";
import LoginClient from "./LoginClient";

export const metadata: Metadata = {
  title: "ログイン・新規登録",
  description: "あまりものにログインまたは新規登録してください。Googleアカウントまたはメールアドレスで簡単にアカウントを作成できます。",
  keywords: ["ログイン", "新規登録", "アカウント", "認証", "Googleログイン"],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "ログイン・新規登録",
    description: "あまりものにログインまたは新規登録してください。Googleアカウントまたはメールアドレスで簡単にアカウントを作成できます。",
    url: '/login',
  },
  twitter: {
    title: "ログイン・新規登録",
    description: "あまりものにログインまたは新規登録してください。Googleアカウントまたはメールアドレスで簡単にアカウントを作成できます。",
  },
};

export default function LoginPage() {
  return <LoginClient />;
} 