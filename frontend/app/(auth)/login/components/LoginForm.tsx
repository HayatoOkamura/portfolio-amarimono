"use client";

import { useState } from "react";
import { useAuth, AuthError } from "@/app/hooks/useAuth";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/api/supabase/supabaseClient";
import styles from "./LoginForm.module.scss";

export default function LoginForm({ isLogin, onToggleMode }: { isLogin: boolean; onToggleMode: () => void }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { login, register, isLoggingIn, isRegistering } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setIsSuccess(false);

    try {
      if (isLogin) {
        // ログイン処理
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        
        if (error) {
          throw { type: 'LOGIN_FAILED', message: error.message } as AuthError;
        }

        if (!data.session) {
          throw { type: 'LOGIN_FAILED', message: "セッションの取得に失敗しました" } as AuthError;
        }

        // ユーザー情報の同期
        const syncResponse = await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.session.access_token}`
          },
        });

        if (!syncResponse.ok) {
          const errorData = await syncResponse.json();
          throw { type: 'LOGIN_FAILED', message: errorData.error || 'ユーザー情報の同期に失敗しました' } as AuthError;
        }

        // 成功時はTOPページにリダイレクト
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        // 登録処理
        const error = await register({ email, password });
        if (error) {
          throw error;
        }
        setIsSuccess(true);
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (error) {
      setIsSuccess(false);
      
      if ((error as AuthError)?.type) {
        const authError = error as AuthError;
        setFormError(authError.message);
      } else {
        setFormError('予期せぬエラーが発生しました');
      }
    }
  };

  const isProcessing = isLogin ? isLoggingIn : isRegistering;

  return (
    <form onSubmit={handleSubmit} className={styles.form_block}>
      <div className={styles.form_block__group}>
        <label htmlFor="email" className={styles.form_block__label}>メールアドレス</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={styles.form_block__input}
        />
      </div>
      <div className={styles.form_block__group}>
        <label htmlFor="password">パスワード</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className={styles.form_block__input}
        />
      </div>
      {formError && (
        <div className={styles.form_block__error}>
          <p>{formError}</p>
          {formError.includes('既に登録されています') && (
            <p className={styles.form_block__error_action}>
              ログインページから続けてください
            </p>
          )}
        </div>
      )}
      {isSuccess && !formError && (
        <div className={styles.form_block__success}>
          <p>
            {isLogin 
              ? "ログインに成功しました。TOPページに移動します..."
              : "確認メールを送信しました。\nメールをご確認ください。"}
          </p>
        </div>
      )}
      <button type="submit" disabled={isProcessing} className={styles.form_block__submit_button}>
        {isProcessing ? "処理中..." : isLogin ? "ログイン" : "登録"}
      </button>

      <div className={styles.form_block__toggle}>
        {isLogin ? (
          <p>
            アカウントをお持ちでない方は{" "}
            <button type="button" onClick={onToggleMode} className={styles.form_block__link_button}>
              新規登録
            </button>
          </p>
        ) : (
          <p>
            すでにアカウントをお持ちの方は{" "}
            <button type="button" onClick={onToggleMode} className={styles.form_block__link_button}>
              ログイン
            </button>
          </p>
        )}
      </div>
    </form>
  );
}

