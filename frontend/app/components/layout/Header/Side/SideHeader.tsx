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
import ClientAuthMenu from "./ClientAuthMenu";

const SideHeader = () => {
  const pathname = usePathname();

  // 現在のパスがリンク先と一致すれば is-active を付与
  const getActiveClass = (paths: string[]) =>
    paths.includes(pathname) ? styles["is-active"] : "";

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
            className={`${styles.header_block__icon} ${getActiveClass([
              "/recipes/new",
            ])}`}
          >
            <Link href="/recipes/new/">
              <BsPencilSquare />
              <p className={styles.header_block__text}>レシピ登録</p>
            </Link>
          </div>
          <div
            className={`${styles.header_block__icon} ${getActiveClass([
              "/recipes/my",
            ])}`}
          >
            <Link href="/recipes/my/">
              <FaListUl />
              <p className={styles.header_block__text}>レシピ一覧</p>
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
          <ClientAuthMenu />
        </div>
      </div>
    </header>
  );
};

export default SideHeader;
