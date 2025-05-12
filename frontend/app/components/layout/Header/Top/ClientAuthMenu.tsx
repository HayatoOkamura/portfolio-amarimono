"use client";

import React, { useState } from "react";
import styles from "./TopHeader.module.scss";
import { useUserStore } from "@/app/stores/userStore";
import { FaUserCircle } from "react-icons/fa";
import Image from "next/image";
import Link from "next/link";

const ClientAuthMenu = () => {
  const { user } = useUserStore();
  const [imageError, setImageError] = useState(false);

  return (
    <>
      {user ? (
        <div className={styles.user_block}>
          <Link href="/user/">
            <div className={styles.user_block__icon}>
              {user.profileImage && !imageError ? (
                <Image
                  src={`${process.env.NEXT_PUBLIC_IMAGE_BASE_URL}/uploads/${user.profileImage}`}
                  alt="User Profile"
                  className={styles.user_block__icon_img}
                  width={100}
                  height={100}
                  onError={() => setImageError(true)}
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