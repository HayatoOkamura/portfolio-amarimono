"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";
import styles from "./TopHeader.module.scss";
import Link from "next/link";
import Image from "next/image";
import ClientAuthMenu from "./ClientAuthMenu";
import HamburgerMenu from "../HamburgerMenu/HamburgerMenu";
import MobileMenuModal from "../MobileMenuModal/MobileMenuModal";
import { useRouter } from "next/navigation";
import useRecipeStore from "@/app/stores/recipeStore";
import { ResponsiveWrapper } from "@/app/components/common/ResponsiveWrapper";
import { useSearchRecipes } from "@/app/hooks/recipes";

const TopHeader = () => {
  const router = useRouter();
  const { setSearchType, setQuery, setSearchExecuted, setRecipes } = useRecipeStore();
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { refetch } = useSearchRecipes(searchInput, {
    enabled: false
  });

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setSearchType("name");
    setQuery(searchInput);
    setSearchExecuted(true);

    try {
      const result = await refetch();
      if (result.isError) {
        console.error('レシピの取得に失敗しました:', result.error);
        toast.error('レシピの取得に失敗しました。もう一度お試しください。');
        return;
      }

      if (!result.isSuccess || !result.data) {
        console.error('レシピデータが取得できませんでした');
        toast.error('レシピデータが取得できませんでした。もう一度お試しください。');
        return;
      }

      // バックエンド側で正規化検索が実装されたので、結果をそのまま使用
      setRecipes(result.data);
      router.push("/recipes");
    } catch (error) {
      console.error('Search error:', error);
      toast.error('レシピの検索中にエラーが発生しました。もう一度お試しください。');
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <ResponsiveWrapper
          breakpoint="tab"
          renderBelow={
            <div className={styles.header_block__logo}>
              <Link href="/">
                <Image
                  src="/images/common/logo.svg"
                  alt="あまりもの ロゴ"
                  width={100}
                  height={100}
                  className={styles.header_block__logo_img}
                />
              </Link>
            </div>
          }
        >
          <></>
        </ResponsiveWrapper>
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
        <ResponsiveWrapper
          breakpoint="tab"
          renderBelow={
             <></>
          }
        >
          <ClientAuthMenu />
        </ResponsiveWrapper>
      </div>
      <ResponsiveWrapper
        breakpoint="tab"
        renderBelow={
          <HamburgerMenu onClick={toggleModal} isOpen={isModalOpen} />
        }
      >
        <></>
      </ResponsiveWrapper>
      <MobileMenuModal isOpen={isModalOpen} onClose={toggleModal} />
    </header>
  );
};

export default TopHeader;
