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
        const error = await login({ email, password });
        if (error) {
          throw error;
        }

        // セッションとユーザー情報を確認
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw { type: 'LOGIN_FAILED', message: "セッションの取得に失敗しました" } as AuthError;
        }

        if (!session?.user) {
          throw { type: 'LOGIN_FAILED', message: "ログインに失敗しました" } as AuthError;
        }

        // ユーザー情報を取得
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw { type: 'LOGIN_FAILED', message: "ユーザー情報の取得に失敗しました" } as AuthError;
        }

        // すべての確認が完了したら成功メッセージを表示
        setIsSuccess(true);
        setTimeout(() => {
          router.push("/");
        }, 2000);
      } else {
        const error = await register({ email, password });
        if (error) {
          throw error;
        }
        setIsSuccess(true);
      }
    } catch (error) {
      setIsSuccess(false);
      
      if ((error as AuthError)?.type) {
        const authError = error as AuthError;
        
        switch (authError.type) {
          case 'EMAIL_IN_USE':
            setFormError(authError.message);
            break;
          case 'REGISTRATION_FAILED':
            setFormError(authError.message);
            break;
          case 'LOGIN_FAILED':
            setFormError(authError.message);
            break;
          case 'RATE_LIMIT':
            setFormError(authError.message);
            break;
          case 'EMAIL_NOT_CONFIRMED':
            setFormError(authError.message);
            await new Promise(resolve => setTimeout(resolve, 2000));
            break;
          case 'UNKNOWN':
            setFormError(authError.message);
            break;
          default:
            setFormError('予期せぬエラーが発生しました');
        }
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
              : "新規登録が完了しました。確認メールを送信しました。メールをご確認ください。"}
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

