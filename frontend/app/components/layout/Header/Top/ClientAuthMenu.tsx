"use client";

import React, { useState } from "react";
import styles from "./TopHeader.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";
import { imageBaseUrl } from "@/app/utils/api";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

const ClientAuthMenu = () => {
  const { user } = useUserStore();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      {user ? (
        <div className={styles.user_block}>
          <Link href="/user/">
            <div className={styles.user_block__icon}>
              {user.profileImage && !imageError ? (
                <OptimizedImage
                  src={`${imageBaseUrl}/${user.profileImage}`}
                  alt="User Profile"
                  className={styles.user_block__icon_img}
                  width={100}
                  height={100}
                  onError={handleImageError}
                  priority
                />
              ) : (
                <FaUserCircle className={styles.user_block__icon_img} />
              )}
            </div>
            <p className={styles.user_block__name}>
              {user.username || "名前未設定"}
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