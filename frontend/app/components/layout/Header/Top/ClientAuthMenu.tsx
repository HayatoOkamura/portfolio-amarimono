"use client";

import React from "react";
import styles from "./TopHeader.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const ClientAuthMenu = () => {
  const { user } = useUserStore();

  return (
    <>
      {user ? (
        <div className={styles.user_block}>
          <Link href="/user/">
            <div className={styles.user_block__icon}>
              {user.profileImage ? (
                <Image
                  src={user.profileImage}
                  alt="User Profile"
                  className={styles.user_block__icon_img}
                  width={100}
                  height={100}
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
    </>
  );
};

export default ClientAuthMenu;