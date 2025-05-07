"use client";

import React, { useState } from "react";
import styles from "./TopHeader.module.scss";
import Link from "next/link";
import ClientAuthMenu from "./ClientAuthMenu";
import { useRouter } from "next/navigation";
import useRecipeStore from "@/app/stores/recipeStore";

const TopHeader = () => {
  const router = useRouter();
  const { setSearchType, setQuery, setSearchExecuted } = useRecipeStore();
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setSearchType("name");
    setQuery(searchInput);
    setSearchExecuted(true);
    router.push("/recipes");
  };

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.search_block}>
          <form onSubmit={handleSearch} className={styles.search_block__form}>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="レシピを検索（料理名を入力してください）"
              className={styles.search_block__input}
            />
            <button type="submit" className={styles.search_block__button}>
              検索
            </button>
          </form>
        </div>
        <ClientAuthMenu />
      </div>
    </header>
  );
};

export default TopHeader;
