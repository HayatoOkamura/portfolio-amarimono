'use client';

import styles from './help.module.scss';

export default function HelpClient() {
  return (
    <div className={styles.help_block}>
      <div className={styles.help_block__header}>
        <h1 className={styles.help_block__title}>ヘルプ</h1>
        <p className={styles.help_block__subtitle}>
          アプリの使い方やよくある質問を確認できます
        </p>
      </div>

      <div className={styles.help_block__content}>
        <div className={styles.help_section_block}>
          <div className={styles.help_section_block__header}>
            <h2 className={styles.help_section_block__title}>基本的な使い方</h2>
          </div>
          <div className={styles.help_content_block}>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>レシピの登録</h3>
              <ol className={styles.help_content_block__list}>
                <li>「レシピを登録」ボタンをクリック</li>
                <li>レシピ名、材料、手順を入力</li>
                <li>「保存」ボタンをクリック</li>
              </ol>
            </div>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>レシピの検索</h3>
              <ol className={styles.help_content_block__list}>
                <li>検索バーにキーワードを入力</li>
                <li>材料名やレシピ名で検索可能</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={styles.help_section_block}>
          <div className={styles.help_section_block__header}>
            <h2 className={styles.help_section_block__title}>主な機能</h2>
          </div>
          <div className={styles.help_content_block}>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>レシピ管理</h3>
              <ul className={styles.help_content_block__list}>
                <li>レシピの登録・編集・削除</li>
                <li>材料の在庫管理</li>
                <li>レシピの検索とフィルタリング</li>
              </ul>
            </div>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>在庫管理</h3>
              <ul className={styles.help_content_block__list}>
                <li>材料の在庫数の登録</li>
                <li>在庫切れの通知</li>
                <li>買い物リストの作成</li>
              </ul>
            </div>
          </div>
        </div>

        <div className={styles.help_section_block}>
          <div className={styles.help_section_block__header}>
            <h2 className={styles.help_section_block__title}>よくある質問</h2>
          </div>
          <div className={styles.help_content_block}>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>レシピの編集方法</h3>
              <p className={styles.help_content_block__text}>
                レシピ一覧から編集したいレシピを選択し、「編集」ボタンをクリックしてください。
                必要な情報を更新後、「保存」ボタンをクリックすると変更が反映されます。
              </p>
            </div>
            <div className={styles.help_content_block__item}>
              <h3 className={styles.help_content_block__subtitle}>在庫の更新方法</h3>
              <p className={styles.help_content_block__text}>
                材料一覧から更新したい材料を選択し、「在庫を更新」ボタンをクリックしてください。
                新しい在庫数を入力後、「保存」ボタンをクリックすると更新されます。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 