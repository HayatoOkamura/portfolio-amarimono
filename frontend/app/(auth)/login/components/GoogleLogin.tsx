"use client";

import { FcGoogle } from "react-icons/fc";
import { createClient } from "@supabase/supabase-js";
import styles from "./GoogleLogin.module.scss";

export default function GoogleLogin() {
  const handleGoogleLogin = async () => {
    try {
      console.log("Starting Google login...");
      const redirectUrl = `${window.location.origin}/callback`;
      console.log("Redirect URL:", redirectUrl);

      // 認証用の本番環境のクライアントを作成
      const prodSupabase = createClient(
        process.env.NEXT_PUBLIC_PROD_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_PROD_SUPABASE_ANON_KEY!,
        {
          auth: {
            persistSession: true,
            storageKey: 'sb-auth-token',
            storage: {
              getItem: (key: string): string | null => {
                const cookie = document.cookie
                  .split('; ')
                  .find((row) => row.startsWith(`${key}=`));
                return cookie ? cookie.split('=')[1] : null;
              },
              setItem: (key: string, value: string): void => {
                document.cookie = `${key}=${value}; path=/; max-age=3600; secure; samesite=lax`;
              },
              removeItem: (key: string): void => {
                document.cookie = `${key}=; path=/; max-age=0; secure; samesite=lax`;
              },
            },
          },
        }
      );

      const { data, error } = await prodSupabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error("Google login error:", error);
        throw new Error(error.message);
      }

      console.log("Google login response:", data);
    } catch (error) {
      console.error("Unexpected error during Google login:", error);
      alert(error instanceof Error ? error.message : "ログイン中にエラーが発生しました");
    }
  };

  return (
    <button onClick={handleGoogleLogin} className={styles.google_block}>
      <FcGoogle className={styles.google_block__icon} />
      Googleでログイン
    </button>
  );
} 