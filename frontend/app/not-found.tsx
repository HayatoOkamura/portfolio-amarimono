import Link from 'next/link';
import styles from './not-found.module.scss';

// 静的生成の最適化
export const dynamic = 'force-static';
export const revalidate = false;

export default function NotFound() {
  return (
    <div className={styles.not_found_block}>
      <div className={styles.not_found_block__container}>
        <h1 className={styles.not_found_block__title}>404</h1>
        <h2 className={styles.not_found_block__subtitle}>ページが見つかりません</h2>
        <p className={styles.not_found_block__message}>
          お探しのページは存在しないか、移動された可能性があります。
          <br />
          URLをご確認いただくか、ホームページからお探しください。
        </p>
        <Link 
          href="/" 
          className={styles.not_found_block__button}
        >
          ホームに戻る
        </Link>
      </div>
    </div>
  );
} 