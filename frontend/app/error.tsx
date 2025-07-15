'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './error.module.scss';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className={styles.error_block}>
      <div className={styles.error_block__container}>
        <h1 className={styles.error_block__title}>500</h1>
        <h2 className={styles.error_block__subtitle}>サーバーエラーが発生しました</h2>
        <p className={styles.error_block__message}>
          申し訳ございません。サーバーでエラーが発生しました。
          <br />
          しばらく時間をおいてから再度お試しください。
        </p>
        <div className={styles.error_block__actions}>
          <button
            onClick={reset}
            className={`${styles.error_block__button} ${styles['error_block__button--primary']}`}
          >
            再試行
          </button>
          <Link 
            href="/" 
            className={`${styles.error_block__button} ${styles['error_block__button--secondary']}`}
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  );
} 