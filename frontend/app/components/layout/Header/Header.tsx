"use client";

import React, { useEffect } from "react";
import styles from "./Header.module.scss";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUser } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { TbBowlSpoonFilled } from "react-icons/tb";
import { FaHeart } from "react-icons/fa";
import { IoIosExit } from "react-icons/io";
import { useUserStore } from "@/app/stores/userStore";

const Header = () => {
  const { user, signOut } = useUserStore();
  const pathname = usePathname(); // 現在のパスを取得

  // 現在のパスがリンク先と一致すれば is-active を付与
  const getActiveClass = (paths: string[]) =>
    paths.includes(pathname) ? styles["is-active"] : "";

  useEffect(() => {
    console.log("パス", pathname);
    
  }, [pathname])

  return (
    <header className={styles.header_block}>
      <div className={styles.header_block__inner}>
        <div className={styles.header_block__logo}>
          <Link href="/">
            <Image
              fill
              src="/images/common/logo.svg"
              alt="あまりもの ロゴ"
              unoptimized
            />
          </Link>
        </div>
        <div className={styles.header_block__contents}>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/user",
              "/login",
            ])}`}
          >
            <Link href="/user">
              <FaUser />
              <p className={styles.header_block__text}>User</p>
            </Link>
          </div>

          <div
            className={`${styles.header_block__icon} ${
              styles["header_block__icon--middle"]
            } ${getActiveClass(["/"])}`}
          >
            <Link href="/">
              <ImSpoonKnife />
              <p className={styles.header_block__text}>Search</p>
            </Link>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/recipes/new",
            ])}`}
          >
            <Link href="/recipes/new/">
              <TbBowlSpoonFilled />
              <p className={styles.header_block__text}>Make</p>
            </Link>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/favorite",
            ])}`}
          >
            <Link href="/favorite/">
              <FaHeart />
              <p className={styles.header_block__text}>Favorite</p>
            </Link>
          </div>
          <div
            className={`${styles.header_block__icon} ${styles["header_block__icon--foot"]}`}
            onClick={signOut}
          >
            <a>
              <IoIosExit />
              <p className={styles.header_block__text}>Logout</p>
            </a>
          </div>
        </div>
        <div className={styles.header_block__is_login}>
          {user ? "ログイン済み" : "未ログイン"}
        </div>
      </div>
    </header>
  );
};

export default Header;
