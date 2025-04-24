"use client";

import { useState } from "react";
import LoginForm from "./components/LoginForm";
import GoogleLogin from "./components/GoogleLogin";
import styles from "./page.module.scss";

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className={styles.auth_block}>
      <div className={styles.auth_block__inner}>
        <div className={styles.auth_block__tabs}>
          <button
            className={`${styles.auth_block__tab} ${isLogin ? styles.active : ""}`}
            onClick={() => {setIsLogin(true), console.log(isLogin);
            }}
          >
            ログイン
          </button>
          <button
            className={`${styles.auth_block__tab} ${!isLogin ? styles.active : ""}`}
            onClick={() => {setIsLogin(false), console.log(isLogin);
            }}
          >
            新規登録
          </button>
        </div>
        <div className={styles.auth_block__content}>
          <h1 className={styles.auth_block__title}>
            {isLogin ? "ログイン" : "新規登録"}
          </h1>
          <GoogleLogin />
          <div className={styles.auth_block__divider}>
            <span>または</span>
          </div>
          <LoginForm isLogin={isLogin} onToggleMode={() => setIsLogin(!isLogin)} />
        </div>
      </div>
    </div>
  );
} 