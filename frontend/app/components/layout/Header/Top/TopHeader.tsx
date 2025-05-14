"use client";

import React, { useState } from "react";
import styles from "./TopHeader.module.scss";
import Link from "next/link";
import Image from "next/image";
import ClientAuthMenu from "./ClientAuthMenu";
import HamburgerMenu from "../HamburgerMenu/HamburgerMenu";
import MobileMenuModal from "../MobileMenuModal/MobileMenuModal";
import { useRouter } from "next/navigation";
import useRecipeStore from "@/app/stores/recipeStore";
import { ResponsiveWrapper } from "@/app/components/common/ResponsiveWrapper";

const TopHeader = () => {
  const router = useRouter();
  const { setSearchType, setQuery, setSearchExecuted } = useRecipeStore();
  const [searchInput, setSearchInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setSearchType("name");
    setQuery(searchInput);
    setSearchExecuted(true);
    router.push("/recipes");
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
                  priority
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
