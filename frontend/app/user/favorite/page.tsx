/* eslint-disable */
import type { Metadata } from "next";
import FavoriteClient from "./FavoriteClient";

export const metadata: Metadata = {
  title: "お気に入りレシピ",
  description: "お気に入りに登録したレシピの一覧を確認できます。お気に入りのレシピを簡単に管理できます。",
  keywords: ["お気に入り", "お気に入りレシピ", "レシピ管理", "お気に入り登録"],
  openGraph: {
    title: "お気に入りレシピ",
    description: "お気に入りに登録したレシピの一覧を確認できます。お気に入りのレシピを簡単に管理できます。",
    url: '/user/favorite',
  },
  twitter: {
    title: "お気に入りレシピ",
    description: "お気に入りに登録したレシピの一覧を確認できます。お気に入りのレシピを簡単に管理できます。",
  },
};

export default function FavoritePage() {
  return <FavoriteClient />;
}
