"use client";

import React, { useState } from "react";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import { imageBaseUrl } from "@/app/utils/api";
import styles from "./user.module.scss";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import OptimizedImage from "@/app/components/ui/OptimizedImage/OptimizedImage";

const UserProfile = () => {
  const { user, isLoading } = useUserStore();
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  if (!user) {
    return (
      <PageLoading isLoading={isLoading}>
        <div className={styles.profile_block}>
          <div className={styles.profile_block__head}>
            <div className={styles.profile_block__image}>
              <FaUserCircle size={100} />
            </div>
            <div className={styles.profile_block__detail}>
              <h1 className={styles.profile_block__name}>ユーザーが見つかりません</h1>
              <p className={styles.profile_block__email}>ログインしてください</p>
            </div>
          </div>
        </div>
      </PageLoading>
    );
  }

  return (
    <PageLoading isLoading={isLoading}>
      <div className={styles.profile_block}>
        <div className={styles.profile_block__head}>
          <div className={styles.profile_block__image}>
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
              <FaUserCircle size={100} />
            )}
          </div>
          <div className={styles.profile_block__detail}>
            <h1 className={styles.profile_block__name}>
              {user.username || "名前未設定"}
            </h1>
            <p className={styles.profile_block__email}>{user.email}</p>
          </div>
        </div>
      </div>
    </PageLoading>
  );
};

export default UserProfile; 