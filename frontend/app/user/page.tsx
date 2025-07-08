/* eslint-disable */
import styles from "./user.module.scss";
import type { Metadata } from "next";
import UserProfileClient from "./UserProfileClient";

// メタデータ設定のためのサーバーコンポーネント
export const metadata: Metadata = {
  title: "ユーザー情報",
  description: "あなたのプロフィール情報、レシピ投稿数、いいね数、レビュー平均などを確認できます。おすすめレシピも表示されます。",
  keywords: ["ユーザー情報", "プロフィール", "レシピ投稿", "いいね", "レビュー", "おすすめレシピ"],
  openGraph: {
    title: "ユーザー情報",
    description: "あなたのプロフィール情報、レシピ投稿数、いいね数、レビュー平均などを確認できます。おすすめレシピも表示されます。",
    url: '/user',
  },
  twitter: {
    title: "ユーザー情報",
    description: "あなたのプロフィール情報、レシピ投稿数、いいね数、レビュー平均などを確認できます。おすすめレシピも表示されます。",
  },
};

export default function UserPage() {
  return <UserProfileClient />;
}
