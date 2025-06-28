"use client";

import React from "react";
import styles from "./SideHeader.module.scss";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaListUl } from "react-icons/fa";
import { BsPencilSquare } from "react-icons/bs";
import { FaHeart } from "react-icons/fa";
import { FaCog } from "react-icons/fa";
import { CgSmartHomeRefrigerator } from "react-icons/cg";
import { useUserStore } from "@/app/stores/userStore";
import ClientAuthMenu from "./ClientAuthMenu";
import { useAuth } from "@/app/hooks/useAuth";

const SideHeader = () => {
  const { user } = useUserStore();
  const pathname = usePathname();
  const { user: authUser, isLoading } = useAuth();
  const isAdmin = authUser?.role === "admin";

  // 現在のパスがリンク先と一致すれば is-active を付与
  const getActiveClass = (paths: string[], exactMatch: boolean = false) => {
    return paths.some(path => 
      exactMatch 
        ? pathname === path 
        : pathname === path || pathname.startsWith(path + '/')
    ) ? styles["is-active"] : "";
  };

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.header_block__logo}>
          <Link href="/">
            <Image
              src="/images/common/logo_main.svg"
              alt="あまりもの ロゴ"
              width={100}
              height={100}
              priority
            />
          </Link>
        </div>
        <div className={styles.header_block__contents}>
          <div
            className={`${styles.header_block__icon} ${
              styles["header_block__icon--middle"]
            } ${getActiveClass(["/"])}`}
          >
            <Link href="/">
              <ImSpoonKnife />
              <p className={styles.header_block__text}>具材から探す</p>
            </Link>
          </div>
          {user && (
            <div className={styles.header_block__group}>
              <div
                className={`${styles.header_block__icon} ${getActiveClass([
                  "/user",
                ])}`}
              >
                <Link href="/user/">
                  <FaUserCircle />
                  <p className={styles.header_block__text}>マイページ</p>
                </Link>
              </div>
              <div
                className={`${styles.header_block__icon} ${
                  styles["header_block__icon--child"]
                } ${getActiveClass(["/user/recipes/new"], true)}`}
              >
                <Link href="/user/recipes/new/">
                  <BsPencilSquare />
                  <p className={styles.header_block__text}>レシピ登録</p>
                </Link>
              </div>
              <div
                className={`${styles.header_block__icon} ${
                  styles["header_block__icon--child"]
                } ${getActiveClass(["/user/recipes"], true)}`}
              >
                <Link href="/user/recipes/">
                  <FaListUl />
                  <p className={styles.header_block__text}>レシピ一覧</p>
                </Link>
              </div>
              <div
                className={`${styles.header_block__icon} ${
                  styles["header_block__icon--child"]
                } ${getActiveClass(["/user/settings"], true)}`}
              >
                <Link href="/user/settings/">
                  <CgSmartHomeRefrigerator />
                  <p className={styles.header_block__text}>具材の登録</p>
                </Link>
              </div>
              <div
                className={`${styles.header_block__icon} ${
                  styles["header_block__icon--child"]
                } ${getActiveClass(["/user/favorite"], true)}`}
              >
                <Link href="/user/favorite/">
                  <FaHeart />
                  <p className={styles.header_block__text}>お気に入り</p>
                </Link>
              </div>
            </div>
          )}
          {!isLoading && isAdmin && (
            <div
              className={`${styles.header_block__icon} ${getActiveClass([
                "/admin",
              ], false)}`}
            >
              <Link href="/admin/">
                <FaCog />
                <p className={styles.header_block__text}>管理画面</p>
              </Link>
            </div>
          )}
          <ClientAuthMenu />
        </div>
      </div>
    </header>
  );
};

export default SideHeader;
