# Supabase Prepared Statement エラー修正手順

## 問題の概要

SupabaseのPgBouncer（ポート6543）は**トランザクションプーリングモード**で動作し、prepared statementに対応していません。これにより、複数のアプリケーションインスタンスや接続でprepared statement名の衝突が発生します。

参考記事: [Prisma + Supabase ポート6543の罠！謎のエラーとの格闘記](https://zenn.dev/taka4rest/articles/bef721a313f5b1)

## 現在の状況確認

### ✅ 確認済み
- 接続先: `aws-0-ap-northeast-1.pooler.supabase.com:6543`
- エラー: `prepared statement "..." already exists`
- 環境: 本番環境（production）

### 🔍 問題の根本原因
1. **PgBouncerのトランザクションプーリングモード**
   - ポート6543で動作
   - prepared statementをサポートしていない
   - トランザクションごとに接続を使い回す

2. **GORMのprepared statement使用**
   - 現在の設定: `PreferSimpleProtocol: false`
   - prepared statementを作成しようとする
   - PgBouncerと競合

## 修正手順

### Phase 1: 接続設定の変更（推奨）

#### Step 1: 直接接続への変更
**目的**: PgBouncerを回避し、直接PostgreSQLに接続

1. **Supabaseダッシュボードで設定確認**
   ```
   Database > Connection Info > Use connection pooling のチェックを外す
   ```

2. **環境変数の更新**
   ```bash
   # 現在の設定（問題あり）
   SUPABASE_DB_HOST=aws-0-ap-northeast-1.pooler.supabase.com
   SUPABASE_DB_PORT=6543
   
   # 修正後の設定（直接接続）
   SUPABASE_DB_HOST=aws-0-ap-northeast-1.supabase.co
   SUPABASE_DB_PORT=5432
   ```

3. **接続文字列の確認**
   ```
   # 修正前（PgBouncer経由）
   host=aws-0-ap-northeast-1.pooler.supabase.com port=6543
   
   # 修正後（直接接続）
   host=aws-0-ap-northeast-1.supabase.co port=5432
   ```

#### Step 2: 接続プール設定の調整
**目的**: 直接接続での同時接続数制限に対応

```go
// backend/db/connection.go の修正
if environment == "production" {
    // 直接接続用の設定（接続数を増やす）
    sqlDB.SetMaxIdleConns(5)                  // アイドル接続を増加
    sqlDB.SetMaxOpenConns(10)                 // 同時接続数を増加
    sqlDB.SetConnMaxLifetime(10 * time.Minute) // 接続の生存時間を延長
    sqlDB.SetConnMaxIdleTime(5 * time.Minute)  // アイドル接続の生存時間を延長
}
```

#### Step 3: GORM設定の最適化
**目的**: prepared statementを有効活用

```go
// backend/db/connection.go の修正
database, err := gorm.Open(postgres.New(postgres.Config{
    DSN:                  dsn,
    PreferSimpleProtocol: false, // prepared statementを使用（理想的）
}), &gorm.Config{
    // ... 他の設定 ...
    PrepareStmt: true, // prepared statementを有効化
})
```

### Phase 2: 代替案（PgBouncer継続使用）

#### Step 1: PgBouncer対応設定
**目的**: PgBouncerとprepared statementの競合を回避

```go
// backend/db/connection.go の修正
database, err := gorm.Open(postgres.New(postgres.Config{
    DSN:                  dsn,
    PreferSimpleProtocol: true, // prepared statementを無効化（PgBouncer対応）
}), &gorm.Config{
    // ... 他の設定 ...
    PrepareStmt: false, // prepared statementを無効化
})
```

#### Step 2: JSONB処理の対応
**目的**: PreferSimpleProtocol: trueでのJSONB処理エラーを回避

```go
// カスタムコールバックの追加（必要に応じて）
db.Callback().Create().Before("gorm:create").Register("jsonb_marshal", func(db *gorm.DB) {
    // JSONBフィールドの手動マーシャリング
    // 詳細は必要に応じて実装
})
```

### Phase 3: 環境変数の更新

#### Step 1: 本番環境変数の更新
```bash
# Render または環境変数設定で更新
SUPABASE_DB_HOST=aws-0-ap-northeast-1.supabase.co
SUPABASE_DB_PORT=5432
USE_POOLER=false
```

#### Step 2: 開発環境変数の確認
```bash
# .env ファイルの確認
SUPABASE_DB_HOST=host.docker.internal
SUPABASE_DB_PORT=54322
USE_POOLER=false
```

### Phase 4: テストと検証

#### Step 1: 接続テスト
```bash
# バックエンドの再起動
docker compose restart backend

# ログの確認
docker compose logs backend
```

#### Step 2: 機能テスト
1. **レシピ登録・編集のテスト**
   - JSONBデータの正常処理確認
   - prepared statementエラーの発生確認

2. **具材登録・編集のテスト**
   - 栄養素データの正常処理確認
   - 画像アップロードの正常動作確認

#### Step 3: パフォーマンステスト
1. **同時接続数の監視**
   - 直接接続での接続数制限確認
   - パフォーマンスへの影響確認

2. **エラーログの監視**
   - prepared statementエラーの解消確認
   - その他のエラーの発生確認

## 推奨アプローチ

### 🎯 最優先: Phase 1（直接接続への変更）

**理由:**
- ✅ 根本的な問題解決
- ✅ prepared statementの恩恵を活用
- ✅ JSONB処理の正常動作
- ⚠️ 同時接続数の制限に注意

### 🔄 代替案: Phase 2（PgBouncer継続）

**理由:**
- ✅ 接続数の制限なし
- ⚠️ prepared statementの恩恵なし
- ⚠️ JSONB処理の複雑化

## 注意事項

### 直接接続での制限
- **同時接続数**: Supabaseの制限に注意
- **接続プール**: 適切な設定が必要
- **監視**: 接続数の監視を強化

### PgBouncer継続での制限
- **prepared statement**: 使用不可
- **JSONB処理**: 手動対応が必要
- **パフォーマンス**: 一部制限

## 実装順序

1. **Phase 1 Step 1**: 直接接続への変更
2. **Phase 1 Step 2**: 接続プール設定の調整
3. **Phase 1 Step 3**: GORM設定の最適化
4. **Phase 3**: 環境変数の更新
5. **Phase 4**: テストと検証

## 参考資料

- [Prisma + Supabase ポート6543の罠！謎のエラーとの格闘記](https://zenn.dev/taka4rest/articles/bef721a313f5b1)
- [Supabase Prepared Statement エラー解決ガイド](https://supabase.com/docs/guides/troubleshooting/error-prepared-statement-xxx-already-exists-3laqeM)
- [PgBouncer トランザクションプーリングモード](https://www.pgbouncer.org/features.html#transaction-pooling)

## 完了チェックリスト

- [ ] 直接接続への変更（Phase 1 Step 1）
- [ ] 接続プール設定の調整（Phase 1 Step 2）
- [ ] GORM設定の最適化（Phase 1 Step 3）
- [ ] 環境変数の更新（Phase 3）
- [ ] 接続テスト（Phase 4 Step 1）
- [ ] 機能テスト（Phase 4 Step 2）
- [ ] パフォーマンステスト（Phase 4 Step 3）
- [ ] エラーログの確認
- [ ] 本番環境での動作確認 