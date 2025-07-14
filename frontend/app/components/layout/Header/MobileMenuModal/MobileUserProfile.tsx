"use client";

import React, { useState } from "react";
import styles from "./MobileMenuModal.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { imageBaseUrl } from "@/app/utils/api";

const MobileUserProfile = () => {
  const { user } = useUserStore();
  const [imageError, setImageError] = useState(false);

  return (
    <div className={styles.user_profile}>
      <div className={styles.user_profile__image}>
        {user && user.profileImage && !imageError ? (
          <Image
            src={`${imageBaseUrl}/${user.profileImage}`}
            alt="User Profile"
            width={80}
            height={80}
            onError={() => setImageError(true)}
          />
        ) : (
          <FaUserCircle size={80} />
        )}
      </div>
      <div className={styles.user_profile__info}>
        <h3 className={styles.user_profile__name}>
          {user ? (user.username || "名前未設定") : "ゲスト"}
        </h3>
        {user && user.email && (
          <p className={styles.user_profile__email}>{user.email}</p>
        )}
        {user ? (
          <Link href="/user/edit" className={styles.user_profile__edit_button}>
            プロフィールを編集
          </Link>
        ) : (
          <Link href="/login" className={styles.user_profile__edit_button}>
            ログイン
          </Link>
        )}
      </div>
    </div>
  );
};

export default MobileUserProfile; 