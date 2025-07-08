import styles from './help.module.scss';
import type { Metadata } from "next";
import HelpClient from "./HelpClient";

export const metadata: Metadata = {
  title: "ヘルプ",
  description: "あまりものアプリの使い方やよくある質問を確認できます。レシピの登録、検索、在庫管理などの基本的な機能について詳しく説明しています。",
  keywords: ["ヘルプ", "使い方", "FAQ", "レシピ登録", "レシピ検索", "在庫管理", "サポート"],
  openGraph: {
    title: "ヘルプ",
    description: "あまりものアプリの使い方やよくある質問を確認できます。レシピの登録、検索、在庫管理などの基本的な機能について詳しく説明しています。",
    url: '/help',
  },
  twitter: {
    title: "ヘルプ",
    description: "あまりものアプリの使い方やよくある質問を確認できます。レシピの登録、検索、在庫管理などの基本的な機能について詳しく説明しています。",
  },
};

export default function HelpPage() {
  return <HelpClient />;
} 