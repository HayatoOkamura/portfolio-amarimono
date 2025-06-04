"use client";

import { FcGoogle } from "react-icons/fc";
import { useAuth } from "@/app/hooks/useAuth";
import styles from "./GoogleLogin.module.scss";

interface GoogleLoginProps {
  isLogin?: boolean;
}

export default function GoogleLogin({ isLogin = true }: GoogleLoginProps) {
  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    console.log('🔍 Google sign-in button clicked', { isLogin });
    try {
      const error = await signInWithGoogle(isLogin);
      console.log('🔍 Google sign-in result:', { 
        hasError: !!error,
        errorMessage: error?.message,
        isLogin
      });
      
      if (error) {
        console.error('Google sign-in error:', error);
      }
    } catch (error) {
      console.error('Unexpected Google sign-in error:', error);
    }
  };

  return (
    <div className={styles.google_login}>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        className={styles.google_login__button}
      >
        <FcGoogle className={styles.google_login__icon} />
        Googleで{isLogin ? "ログイン" : "登録"}
      </button>
    </div>
  );
} 