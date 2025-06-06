"use client";

import React, { useEffect } from "react";
import styles from "./MobileMenuModal.module.scss";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaUserCircle } from "react-icons/fa";
import { ImSpoonKnife } from "react-icons/im";
import { FaListUl } from "react-icons/fa";
import { BsPencilSquare } from "react-icons/bs";
import { FaHeart } from "react-icons/fa";
import { IoLogOut, IoLogIn } from "react-icons/io5";
import { useUserStore } from "@/app/stores/userStore";
import MobileUserProfile from "./MobileUserProfile";
import { FaCog } from "react-icons/fa";
import { useAdmin } from "@/app/hooks/useAdmin";
import { useAuth } from "@/app/hooks/useAuth";
import { CgSmartHomeRefrigerator } from "react-icons/cg";

interface MobileMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenuModal: React.FC<MobileMenuModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useUserStore();
  const { logout } = useAuth();
  const pathname = usePathname();
  const { isAuthorized, isLoading } = useAdmin();

  const getActiveClass = (paths: string[]) =>
    paths.includes(pathname) ? styles["is-active"] : "";

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <div
      className={`${styles.modal_overlay} ${isOpen ? styles["is-open"] : ""}`}
      onClick={onClose}
    >
      <div
        className={`${styles.modal_content} ${isOpen ? styles["is-open"] : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {user && <MobileUserProfile />}
        <nav className={styles.modal_content__nav}>
          <div
            className={`${styles.modal_content__nav_item} ${getActiveClass([
              "/",
            ])}`}
          >
            <Link href="/" onClick={onClose}>
              <ImSpoonKnife />
              <span>具材から探す</span>
            </Link>
          </div>
          {user && (
            <div className={styles.modal_content__nav_group}>
              <div
                className={`${styles.modal_content__nav_item} ${getActiveClass([
                  "/user",
                ])}`}
              >
                <Link href="/user/" onClick={onClose}>
                  <FaUserCircle />
                  <span>マイページ</span>
                </Link>
              </div>
              <div
                className={`${styles.modal_content__nav_item} ${styles["modal_content__nav_item--child"]} ${getActiveClass([
                  "/recipes/new",
                ])}`}
              >
                <Link href="/recipes/new/" onClick={onClose}>
                  <BsPencilSquare />
                  <span>レシピ登録</span>
                </Link>
              </div>
              <div
                className={`${styles.modal_content__nav_item} ${styles["modal_content__nav_item--child"]} ${getActiveClass([
                  "/recipes/my",
                ])}`}
              >
                <Link href="/recipes/my/" onClick={onClose}>
                  <FaListUl />
                  <span>レシピ一覧</span>
                </Link>
              </div>
              <div
                className={`${styles.modal_content__nav_item} ${styles["modal_content__nav_item--child"]} ${getActiveClass([
                  "/user/settings",
                ])}`}
              >
                <Link href="/user/settings/" onClick={onClose}>
                  <CgSmartHomeRefrigerator />
                  <span>具材の登録</span>
                </Link>
              </div>
              <div
                className={`${styles.modal_content__nav_item} ${styles["modal_content__nav_item--child"]} ${getActiveClass([
                  "/favorite",
                ])}`}
              >
                <Link href="/favorite/" onClick={onClose}>
                  <FaHeart />
                  <span>お気に入り</span>
                </Link>
              </div>
            </div>
          )}
          {!isLoading && isAuthorized && (
            <div
              className={`${styles.modal_content__nav_item} ${getActiveClass([
                "/admin",
              ])}`}
            >
              <Link href="/admin/recipes" onClick={onClose}>
                <FaCog />
                <span>管理画面</span>
              </Link>
            </div>
          )}
          {user ? (
            <div
              className={`${styles.modal_content__nav_item} ${styles["modal_content__nav_item--logout"]}`}
              onClick={() => {
                logout();
                onClose();
              }}
            >
              <IoLogOut />
              <span>ログアウト</span>
            </div>
          ) : (
            <div
              className={`${styles.modal_content__nav_item} ${getActiveClass([
                "/login",
              ])}`}
            >
              <Link href="/login/" onClick={onClose}>
                <IoLogIn />
                <span>ログイン</span>
              </Link>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
};

export default MobileMenuModal;
