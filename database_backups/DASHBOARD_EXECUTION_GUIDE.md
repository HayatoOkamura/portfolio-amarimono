# Supabase Dashboard 重複データ削除実行ガイド

## 実行手順

### 1. Supabase Dashboardにアクセス
1. [Supabase Dashboard](https://supabase.com/dashboard) にログイン
2. プロジェクト `qmrjsqeigdkizkrpiahs` を選択
3. 左サイドバーから **SQL Editor** をクリック

### 2. SQLスクリプトの実行
1. **New query** をクリック
2. `remove_duplicates_for_dashboard.sql` の内容をコピー&ペースト
3. **Run** ボタンをクリックして実行

### 3. 実行結果の確認
実行後、以下の結果が表示されます：

#### 重複データの確認結果
- `recipe_genres duplicates:` - 重複しているレシピジャンル
- `units duplicates:` - 重複している単位
- `ingredient_genres duplicates:` - 重複している具材ジャンル

#### 削除後の確認結果
- `After cleanup - recipe_genres:` - クリーンアップ後のレシピジャンル
- `After cleanup - units:` - クリーンアップ後の単位
- `After cleanup - ingredient_genres:` - クリーンアップ後の具材ジャンル

### 4. 期待される結果
- 重複データが削除され、各テーブルで名前がユニークになる
- 各テーブルの `count` がすべて `1` になる

## 注意事項

1. **実行前の確認**: 必ず重複データの確認結果を確認してから削除を実行
2. **バックアップ**: 既に `database_backups/` にバックアップが保存済み
3. **実行後の確認**: 削除後の確認結果で重複が解消されていることを確認

## 次のステップ

重複データ削除が完了したら、以下のコマンドでマイグレーションを再実行：

```bash
supabase db push
```

## トラブルシューティング

### エラーが発生した場合
1. エラーメッセージを確認
2. 必要に応じてSQLを分割して実行
3. バックアップから復元を検討

### 重複が残っている場合
1. 削除後の確認結果を確認
2. 必要に応じて手動で重複データを削除
3. 再度マイグレーションを実行 