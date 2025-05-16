"use client";

import styles from "./LoginModal.module.scss";
import { useRouter } from "next/navigation";

interface LoginModalProps {
  onLogin: () => void;
}

const LoginModal = ({ onLogin }: LoginModalProps) => {
  const router = useRouter();

  return (
    <div className={styles.login_modal}>
      <div className={styles.login_modal__inner}>
        <button
          className={styles.login_modal__close}
          onClick={() => router.back()}
        >
          <span></span>
          <span></span>
        </button>
        <h2 className={styles.login_modal__title}>ログインしてください</h2>
        <button
          className={styles.login_modal__login}
          onClick={onLogin}
        >
          ログイン
        </button>
      </div>
    </div>
  );
};

export default LoginModal; 