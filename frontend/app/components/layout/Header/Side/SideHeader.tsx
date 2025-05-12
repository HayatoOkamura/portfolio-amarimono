"use client";

import React from "react";
import styles from "./SideHeader.module.scss";
import Image from "next/image";
import { CustomLink } from '@/app/components/ui/Link/CustomLink';
import { usePathname } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaListUl } from "react-icons/fa";
import { BsPencilSquare } from "react-icons/bs";
import { FaHeart } from "react-icons/fa";
import { IoLogOut } from "react-icons/io5";
import { IoLogIn } from "react-icons/io5";
import { useUserStore } from "@/app/stores/userStore";
import ClientAuthMenu from "./ClientAuthMenu";

const SideHeader = () => {
  const { user, signOut } = useUserStore();
  const pathname = usePathname(); // 現在のパスを取得

  // 現在のパスがリンク先と一致すれば is-active を付与
  const getActiveClass = (paths: string[]) =>
    paths.includes(pathname) ? styles["is-active"] : "";

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.header_block__logo}>
          <CustomLink href="/">
            <Image
              src="/images/common/logo_main.svg"
              alt="あまりもの ロゴ"
              width={100}
              height={100}
              priority
            />
          </CustomLink>
        </div>
        <div className={styles.header_block__contents}>
          <div
            className={`${styles.header_block__icon} ${
              styles["header_block__icon--middle"]
            } ${getActiveClass(["/"])}`}
          >
            <CustomLink href="/">
              <ImSpoonKnife />
              <p className={styles.header_block__text}>具材から探す</p>
            </CustomLink>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/user",
            ])}`}
          >
            <CustomLink href="/user/">
              <FaUserCircle />
              <p className={styles.header_block__text}>マイページ</p>
            </CustomLink>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/recipes/new",
            ])}`}
          >
            <CustomLink href="/recipes/new/">
              <BsPencilSquare />
              <p className={styles.header_block__text}>レシピ登録</p>
            </CustomLink>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/recipes/my",
            ])}`}
          >
            <CustomLink href="/recipes/my/">
              <FaListUl />
              <p className={styles.header_block__text}>レシピ一覧</p>
            </CustomLink>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/favorite",
            ])}`}
          >
            <CustomLink href="/favorite/">
              <FaHeart />
              <p className={styles.header_block__text}>Favorite</p>
            </CustomLink>
          </div>
          <ClientAuthMenu />
        </div>
      </div>
    </header>
  );
};

export default SideHeader;
