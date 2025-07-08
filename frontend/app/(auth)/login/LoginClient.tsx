"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import GoogleLogin from "./components/GoogleLogin";
import styles from "./page.module.scss";

export default function LoginClient() {
  const [isLogin, setIsLogin] = useState(true);

  const handleTabChange = (isLoginTab: boolean) => {
    setIsLogin(isLoginTab);
  };

  return (
    <div className={styles.auth_block}>
      <div className={styles.auth_block__inner}>
        <div className={styles.auth_block__tabs}>
          <button
            className={`${styles.auth_block__tab} ${isLogin ? styles.active : ""}`}
            onClick={() => handleTabChange(true)}
          >
            ログイン
          </button>
          <button
            className={`${styles.auth_block__tab} ${!isLogin ? styles.active : ""}`}
            onClick={() => handleTabChange(false)}
          >
            新規登録
          </button>
        </div>
        <div className={styles.auth_block__content}>
          <h1 className={styles.auth_block__title}>
            {isLogin ? "ログイン" : "新規登録"}
          </h1>
          <GoogleLogin isLogin={isLogin} />
          <div className={styles.auth_block__divider}>
            <span>または</span>
          </div>
          <LoginForm isLogin={isLogin} onToggleMode={() => handleTabChange(!isLogin)} />
        </div>
      </div>
    </div>
  );
} 