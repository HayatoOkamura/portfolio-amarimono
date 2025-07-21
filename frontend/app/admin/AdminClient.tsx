"use client";

import { useAuthGuard } from "@/app/hooks/useAuthGuard";
import { PageLoading } from "@/app/components/ui/Loading/PageLoading";
import Link from "next/link";
import styles from "./admin.module.scss";

export default function AdminClient() {
  const { isAuthorized, isLoading, user } = useAuthGuard(true);

  if (isLoading) {
    return <PageLoading isLoading={true}>Loading...</PageLoading>;
  }

  if (!isAuthorized) {
    return null; // リダイレクトはuseAuthGuard内で処理
  }

  return (
    <div className={styles.admin__container}>
      <h1 className={styles.admin__title}>管理者ダッシュボード</h1>
      
      <section className={styles.admin__user_info}>
        <h2 className={styles.admin__user_info_title}>ログイン中のユーザー</h2>
        <p className={styles.admin__user_info_text}>メールアドレス: {user?.email}</p>
        <p className={styles.admin__user_info_text}>ユーザー名: {user?.username || "未設定"}</p>
        <p className={styles.admin__user_info_text}>ロール: {user?.role || "user"}</p>
      </section>

      <section className={styles.admin__admin_links}>
        <h2 className={styles.admin__admin_links_title}>管理機能</h2>
        <ul className={styles.admin__admin_links_list}>
          <li className={styles.admin__admin_links_item}>
            <Link href="/admin/recipes" className={styles.admin__admin_links_link}>
              レシピ管理
            </Link>
          </li>
          <li className={styles.admin__admin_links_item}>
            <Link href="/admin/ingredients" className={styles.admin__admin_links_link}>
              具材管理
            </Link>
          </li>
          <li className={styles.admin__admin_links_item}>
            <Link href="/admin/users" className={styles.admin__admin_links_link}>
              ユーザー管理
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
} 