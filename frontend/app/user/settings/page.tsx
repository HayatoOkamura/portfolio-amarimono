import type { Metadata } from "next";
import UserSettingsClient from "./UserSettingsClient";

export const metadata: Metadata = {
  title: "具材の初期設定",
  description: "よく使う具材の初期数量を設定できます。レシピ検索時に自動的に選択され、より効率的なレシピ検索が可能になります。",
  keywords: ["具材設定", "初期設定", "よく使う具材", "レシピ検索", "自動選択"],
  openGraph: {
    title: "具材の初期設定",
    description: "よく使う具材の初期数量を設定できます。レシピ検索時に自動的に選択され、より効率的なレシピ検索が可能になります。",
    url: '/user/settings',
  },
  twitter: {
    title: "具材の初期設定",
    description: "よく使う具材の初期数量を設定できます。レシピ検索時に自動的に選択され、より効率的なレシピ検索が可能になります。",
  },
};

export default function UserSettingsPage() {
  return <UserSettingsClient />;
} 