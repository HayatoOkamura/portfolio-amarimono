"use client";

import React from "react";
import styles from "./SideHeader.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { IoLogOut, IoLogIn } from "react-icons/io5";
import Link from "next/link";

const ClientAuthMenu = () => {
  const { user, signOut } = useUserStore();

  return (
    <>
      {user ? (
        <div
          className={`${styles.header_block__icon} ${styles["header_block__icon--foot"]}`}
          onClick={signOut}
        >
          <a>
            <IoLogOut />
            <p className={styles.header_block__text}>ログアウト</p>
          </a>
        </div>
      ) : (
        <div
          className={`${styles.header_block__icon} ${styles["header_block__icon--foot"]}`}
        >
          <Link href="/login/">
            <IoLogIn />
            <p className={styles.header_block__text}>ログイン</p>
          </Link>
        </div>
      )}
    </>
  );
};

export default ClientAuthMenu; 