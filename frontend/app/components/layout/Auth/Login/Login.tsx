/* eslint-disable */
"use client";

import { useState } from "react";
import { useAuth } from "@/app/hooks/useAuth";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import { FaGoogle } from "react-icons/fa";
import Link from "next/link";
import styles from "./Login.module.scss";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const { login, isLoggingIn } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/callback`,
      },
    });
    if (error) {
      alert(error.message);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_tabs}>
        <button
          className={`${styles.auth_tab} ${isLogin ? styles.active : ""}`}
          onClick={() => setIsLogin(true)}
        >
          ログイン
        </button>
        <button
          className={`${styles.auth_tab} ${!isLogin ? styles.active : ""}`}
          onClick={() => setIsLogin(false)}
        >
          新規登録
        </button>
      </div>

      <div className={styles.auth_content}>
        <h1 className={styles.auth_title}>
          {isLogin ? "ログイン" : "新規登録"}
        </h1>

        <button
          onClick={handleGoogleLogin}
          className={styles.google_button}
          disabled={isLoggingIn}
        >
          <FaGoogle className={styles.google_icon} />
          Googleで{isLogin ? "ログイン" : "登録"}
        </button>

        <div className={styles.divider}>
          <span>または</span>
        </div>

        <form onSubmit={handleEmailLogin} className={styles.auth_form}>
          <div className={styles.form_group}>
            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.form_group}>
            <label htmlFor="password">パスワード</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoggingIn}
            className={styles.auth_button}
          >
            {isLoggingIn
              ? "処理中..."
              : isLogin
              ? "ログイン"
              : "新規登録"}
          </button>
        </form>

        <div className={styles.auth_links}>
          {isLogin ? (
            <>
              <Link href="/forgot-password">パスワードをお忘れですか？</Link>
              <p>
                アカウントをお持ちでない方は{" "}
                <button
                  className={styles.link_button}
                  onClick={() => setIsLogin(false)}
                >
                  新規登録
                </button>
              </p>
            </>
          ) : (
            <p>
              すでにアカウントをお持ちの方は{" "}
              <button
                className={styles.link_button}
                onClick={() => setIsLogin(true)}
              >
                ログイン
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
