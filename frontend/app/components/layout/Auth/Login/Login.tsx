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
  const { isLoading } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
  };

  const handleGoogleLogin = async () => {
    try {
      const redirectUrl = `${window.location.origin}/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error("Google login error:", error);
        alert(error.message);
        return;
      }
      
    } catch (error) {
      console.error("Unexpected error during Google login:", error);
      alert("ログイン中にエラーが発生しました");
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
          disabled={isLoading}
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
            disabled={isLoading}
            className={styles.auth_button}
          >
            {isLoading
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
