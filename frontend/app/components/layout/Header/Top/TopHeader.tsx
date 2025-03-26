"use client";

import React from "react";
import styles from "./TopHeader.module.scss";
import useRecipeStore from "@/app/stores/recipeStore";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const Header = () => {
  const { user } = useUserStore();
  const { setQuery, query } = useRecipeStore();
  const router = useRouter();

  // レシピ検索
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // URL に検索クエリをパラメータとして渡す
      router.push(`/recipes?query=${query}`);
    }
  };

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.search_block}>
          <form onSubmit={handleSearch} className={styles.search_block__form}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="レシピを検索（料理名を入力してください）"
              className={styles.search_block__input}
            />
            <button type="submit" className={styles.search_block__button}>
              検索
            </button>
          </form>
        </div>
        {user ? (
          <div className={styles.user_block}>
            <Link href="/user/">
              <div className={styles.user_block__icon}>
                {user.profileImage ? (
                  <Image
                    fill
                    src={user.profileImage}
                    alt="User Profile"
                    className={styles.user_block__icon_img}
                    unoptimized
                  />
                ) : (
                  <FaUserCircle />
                )}
              </div>
              <p className={styles.user_block__name}>
                {user.username || "ゲスト"}
              </p>
            </Link>
          </div>
        ) : (
          <div className={styles.user_block}>
            <div className={styles.user_block__icon}>
              <Link href="/login/">
                <FaUserCircle />
              </Link>
            </div>
            <p className={styles.user_block__name}>ゲスト</p>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
