"use client";

import { FcGoogle } from "react-icons/fc";
import styles from "./GoogleLogin.module.scss";

export default function GoogleLogin() {
  const handleGoogleLogin = async () => {
    try {
      console.log("Starting Google login...");
      const response = await fetch('/api/auth/google', {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Googleログインに失敗しました');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('認証URLの取得に失敗しました');
      }
    } catch (error) {
      console.error("Google login error:", error);
      alert(error instanceof Error ? error.message : 'ログイン中にエラーが発生しました');
    }
  };

  return (
    <button onClick={handleGoogleLogin} className={styles.google_block}>
      <FcGoogle className={styles.google_block__icon} />
      Googleでログイン
    </button>
  );
} 