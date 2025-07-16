# 手動画像移行ガイド

## 概要
Supabase StorageからCloudflare R2への手動画像移行手順です。

## 前提条件
- Cloudflare R2バケットが作成済み
- 環境変数が設定済み
- 移行スクリプトが準備済み

## 手順

### 1. 移行対象の確認

まず、移行対象の画像を確認します：

```bash
# データベースに接続
docker compose exec db psql -U postgres -d amarimono

# SQLクエリを実行して移行対象を確認
\i scripts/check_images.sql
```

### 2. 小規模テスト移行

少数の画像でテスト移行を実行：

```bash
# 移行スクリプトを実行（ドライラン）
cd scripts
python migrate_images_to_r2.py
# プロンプトで 'y' を入力してドライラン実行

# 実際の移行を実行
python migrate_images_to_r2.py
# プロンプトで 'n' を入力して実際の移行実行
```

### 3. 手動移行の手順

#### 3.1 画像のダウンロード

1. Supabaseダッシュボードにアクセス
2. Storage > images フォルダを開く
3. 移行対象の画像を確認
4. 各画像を手動でダウンロード

#### 3.2 画像のアップロード

1. Cloudflareダッシュボードにアクセス
2. R2 > amarimono-images バケットを開く
3. ダウンロードした画像を適切なパスでアップロード
4. パス構造を維持（例：`ingredients/1.jpg`）

#### 3.3 データベースの更新

```sql
-- 具材の画像パスを更新
UPDATE ingredients 
SET image_url = 'ingredients/1.jpg' 
WHERE id = 1;

-- レシピの画像パスを更新
UPDATE recipes 
SET image_url = 'recipes/recipe-id/main-image.jpg' 
WHERE id = 'recipe-uuid';

-- ユーザーのプロフィール画像パスを更新
UPDATE users 
SET profile_image = 'users/user-id/profile.jpg' 
WHERE id = 'user-uuid';
```

### 4. 移行の検証

#### 4.1 画像の表示確認

1. フロントエンドで画像が正しく表示されるか確認
2. 開発環境と本番環境の両方でテスト
3. 各ページで画像の読み込みを確認

#### 4.2 エラーログの確認

```bash
# 移行ログを確認
cat scripts/migration.log

# アプリケーションログを確認
docker compose logs frontend
docker compose logs backend
```

### 5. 段階的移行

#### 5.1 新規アップロードの切り替え

1. 環境変数を設定：
```env
STORAGE_TYPE=r2
```

2. 新規画像アップロードをテスト
3. 既存画像の表示を確認

#### 5.2 完全移行

1. すべての画像の移行が完了
2. データベースの更新が完了
3. 表示テストが完了
4. Supabase Storageのクリーンアップ

### 6. トラブルシューティング

#### 6.1 よくある問題

**画像が表示されない**
- R2の公開URLが正しく設定されているか確認
- データベースのパスが正しいか確認
- Next.jsのremotePatterns設定を確認

**アップロードエラー**
- R2の認証情報が正しいか確認
- バケット名が正しいか確認
- ファイルサイズ制限を確認

**データベース更新エラー**
- Supabaseの認証情報が正しいか確認
- テーブルとカラム名が正しいか確認

#### 6.2 ロールバック手順

問題が発生した場合のロールバック：

1. 環境変数を元に戻す：
```env
STORAGE_TYPE=supabase
```

2. データベースを元の状態に戻す
3. アプリケーションを再起動

### 7. 完了チェックリスト

- [ ] 移行対象画像の確認完了
- [ ] テスト移行の実行完了
- [ ] 手動移行の実行完了
- [ ] 画像表示の確認完了
- [ ] 新規アップロードのテスト完了
- [ ] エラーログの確認完了
- [ ] 本番環境での動作確認完了
- [ ] Supabase Storageのクリーンアップ完了

## 注意事項

1. **バックアップ**: 移行前に必ずデータベースのバックアップを取得
2. **段階的実行**: 一度にすべてを移行せず、段階的に実行
3. **テスト**: 各段階で十分なテストを実施
4. **ログ確認**: 移行中はログを定期的に確認
5. **エラーハンドリング**: エラーが発生した場合は即座に対応

## 参考リンク

- [Cloudflare R2 ドキュメント](https://developers.cloudflare.com/r2/)
- [Supabase Storage ドキュメント](https://supabase.com/docs/guides/storage)
- [AWS S3 SDK for Go](https://pkg.go.dev/github.com/aws/aws-sdk-go-v2/service/s3) 