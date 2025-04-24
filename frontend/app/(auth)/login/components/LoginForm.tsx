"use client";

import { useState } from "react";
import { useAuth, AuthError } from "@/app/hooks/useAuth";
import styles from "./LoginForm.module.scss";

export default function LoginForm({ isLogin, onToggleMode }: { isLogin: boolean; onToggleMode: () => void }) {
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
        // ログイン処理が完全に完了するまで待機
        await login({ email, password });
        // エラーが発生しなければ成功とみなす
        setIsSuccess(true);
      } else {
        const error = await register({ email, password });
        if (error) {
          throw error;
        }
        // エラーがなければ成功とみなす
        setIsSuccess(true);
      }
    } catch (error) {
      console.log("Form error caught:", error);
      setIsSuccess(false); // エラーが発生した場合は成功状態をリセット
      
      // エラーがAuthError型かどうかをチェック
      if ((error as AuthError)?.type) {
        const authError = error as AuthError;
        console.log("Processing AuthError:", authError);
        
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
          case 'UNKNOWN':
            setFormError(authError.message);
            break;
          default:
            setFormError('予期せぬエラーが発生しました');
        }
      } else {
        console.log("Unknown error type:", error);
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
          <p>ログインに成功しました。TOPページに移動します...</p>
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

