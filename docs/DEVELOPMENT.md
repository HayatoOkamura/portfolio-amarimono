# 開発者向けドキュメント

## 概要

このドキュメントは、Amarimonoプロジェクトの開発者向けの詳細な情報を提供します。

## アーキテクチャ

### システム構成

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (Next.js)     │◄──►│   (Go/Gin)      │◄──►│   (Supabase)    │
│                 │    │                 │    │                 │
│ - React         │    │ - Gin Router    │    │ - PostgreSQL    │
│ - TypeScript    │    │ - GORM          │    │ - Auth          │
│ - CSS Modules   │    │ - JWT Auth      │    │ - Storage       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### データフロー

1. **ユーザー認証**
   ```
   Supabase Auth → Frontend → Backend Sync → Database
   ```

2. **ユーザー情報管理**
   ```
   Frontend → Backend API → Database
   ```

3. **レシピ管理**
   ```
   Frontend → Backend API → Database
   ```

## ユーザー管理機能の設計

### 責任の分離

#### 1. 取得専用関数 (`GetUserByID`)
```go
// 純粋なユーザー情報取得
func GetUserByID(db *gorm.DB, id string) (*User, error)
```
- **責任**: ユーザー情報の取得のみ
- **エラー処理**: エラー時はそのまま返す
- **使用場面**: プロフィール表示、権限チェック

#### 2. 同期専用関数 (`SyncUser`)
```go
// SupabaseとバックエンドDBの同期
func SyncUser(db *gorm.DB, user *User) error
```
- **責任**: 認証DBとアプリDBの同期
- **処理**: 存在しない場合は作成、存在する場合は更新
- **使用場面**: ログイン時、認証状態の同期

#### 3. 作成専用関数 (`CreateUser`)
```go
// 新規ユーザー作成
func CreateUser(db *gorm.DB, user *User) error
```
- **責任**: 新規ユーザーの作成のみ
- **エラー処理**: 重複エラーは別途処理
- **使用場面**: 管理者によるユーザー作成

### API設計

#### エンドポイント一覧

| メソッド | エンドポイント | 機能 | 責任 |
|---------|---------------|------|------|
| GET | `/api/users/:id` | ユーザー取得 | 取得専用 |
| POST | `/api/users/sync` | ユーザー同期 | 同期専用 |
| POST | `/api/users` | ユーザー作成 | 作成専用 |
| PUT | `/api/users/:id` | ユーザー更新 | 更新専用 |
| GET | `/api/users/:id/profile` | プロフィール取得 | 取得専用（ロール付き） |

#### 段階的移行戦略

1. **フェーズ1**: 新機能の追加
   - 新しいエンドポイントを追加
   - 既存エンドポイントは維持

2. **フェーズ2**: フロントエンドの移行
   - フロントエンドで新しいAPIを使用
   - 並行運用で動作確認

3. **フェーズ3**: 古い機能の削除
   - 古いエンドポイントを削除
   - ドキュメントの更新

## エラーハンドリング

### Prepared Statementエラー

#### 問題の詳細
```sql
ERROR: prepared statement "stmt_1" already exists (SQLSTATE 42P05)
```

#### 原因
- 本番環境での並行処理
- 複数のアプリケーションインスタンス
- 接続プールの共有

#### 解決策
```go
// リトライ機能付きクエリ実行
for retry := 0; retry < 5; retry++ {
    err = tx.First(&user, "id = ?", id).Error
    if err == nil {
        return &user, nil
    }
    
    // prepared statementエラーの場合はリトライ
    if strings.Contains(err.Error(), "prepared statement") && 
       strings.Contains(err.Error(), "already exists") {
        time.Sleep(time.Duration(100*(retry+1)) * time.Millisecond)
        continue
    }
    break
}
```

### 重複キーエラー

#### 問題の詳細
```sql
ERROR: duplicate key value violates unique constraint (SQLSTATE 23505)
```

#### 原因
- 並行処理による同時作成
- フロントエンドの重複リクエスト

#### 解決策
```typescript
// フロントエンドでの重複リクエスト防止
const pendingRequests = new Map<string, Promise<any>>();

const executeWithDebounce = async (key: string, operation: () => Promise<any>) => {
    if (pendingRequests.has(key)) {
        return await pendingRequests.get(key);
    }
    
    const promise = operation();
    pendingRequests.set(key, promise);
    
    promise.finally(() => {
        pendingRequests.delete(key);
    });
    
    return promise;
};
```

## データベース設計

### ユーザーテーブル

```sql
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(255),
    age INTEGER,
    gender VARCHAR(50),
    profile_image VARCHAR(500),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);
```

### インデックス

```sql
-- メールアドレスでの検索
CREATE INDEX idx_users_email ON users(email);

-- 削除済みユーザーの除外
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
```

## 開発環境のセットアップ

### 必要なツール

```bash
# Go
go version  # 1.21以上

# Node.js
node --version  # 18以上

# Docker
docker --version

# Supabase CLI
supabase --version
```

### 環境変数

#### バックエンド (.env)
```env
# データベース設定
SUPABASE_DB_HOST=db.qmrjsqeigdkizkrpiahs.supabase.co
SUPABASE_DB_PORT=5432
SUPABASE_DB_USER=postgres
SUPABASE_DB_PASSWORD=your_password
SUPABASE_DB_NAME=postgres

# Supabase設定
SUPABASE_URL=https://qmrjsqeigdkizkrpiahs.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 環境設定
ENVIRONMENT=development
USE_POOLER=false
```

#### フロントエンド (.env.local)
```env
# バックエンドURL
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_INTERNAL_URL=portfolio-amarimono_backend_1
NEXT_PUBLIC_IMAGE_BASE_URL=https://qmrjsqeigdkizkrpiahs.supabase.co/storage/v1/object/public/images

# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://qmrjsqeigdkizkrpiahs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## テスト戦略

### テストの種類

1. **単体テスト**
   - モデル関数のテスト
   - ユーティリティ関数のテスト

2. **統合テスト**
   - APIエンドポイントのテスト
   - データベース操作のテスト

3. **E2Eテスト**
   - ユーザーフローのテスト
   - 認証フローのテスト

### テスト実行

```bash
# バックエンドテスト
cd backend
go test ./...

# フロントエンドテスト
cd frontend
npm test

# テストカバレッジ
go test -cover ./...
npm run test:coverage
```

## デバッグ方法

### ログの確認

```bash
# バックエンドログ
docker compose logs backend

# フロントエンドログ
docker compose logs frontend

# リアルタイムログ
docker compose logs -f backend
```

### デバッグログの追加

```go
// バックエンド
log.Printf("🔍 FunctionName - Processing user: %s", userID)
log.Printf("🔍 FunctionName - Error details: %v", err)
```

```typescript
// フロントエンド
console.log('🔍 FunctionName - Processing request:', requestData);
console.log('🔍 FunctionName - Response:', response);
```

### データベースの確認

```bash
# Supabase CLI
supabase db reset
supabase db diff

# 直接接続
psql postgresql://postgres:password@localhost:54322/postgres
```

## パフォーマンス最適化

### データベース最適化

1. **接続プール設定**
   ```go
   sqlDB.SetMaxIdleConns(0)                   // アイドル接続を無効化
   sqlDB.SetMaxOpenConns(3)                   // 最大接続数を制限
   sqlDB.SetConnMaxLifetime(10 * time.Minute) // 接続の最大生存時間
   ```

2. **Prepared Statement無効化**
   ```go
   dsn := "host=... prepared_statement_cache_size=0 max_prepared_statements=0"
   ```

3. **インデックスの最適化**
   ```sql
   -- よく使用されるクエリのインデックス
   CREATE INDEX idx_users_email_active ON users(email) WHERE deleted_at IS NULL;
   ```

### フロントエンド最適化

1. **重複リクエスト防止**
   ```typescript
   const pendingRequests = new Map<string, Promise<any>>();
   ```

2. **キャッシュ戦略**
   ```typescript
   // React Queryを使用したキャッシュ
   const { data: user } = useQuery(['user', userId], fetchUser, {
     staleTime: 5 * 60 * 1000, // 5分
     cacheTime: 10 * 60 * 1000, // 10分
   });
   ```

## セキュリティ

### 認証・認可

1. **JWTトークンの検証**
   ```go
   // バックエンドでのトークン検証
   token := c.GetHeader("Authorization")
   if !strings.HasPrefix(token, "Bearer ") {
       c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
       return
   }
   ```

2. **権限チェック**
   ```go
   // 管理者権限のチェック
   if userRole != "admin" {
       c.JSON(http.StatusForbidden, gin.H{"error": "Admin access required"})
       return
   }
   ```

### データ検証

1. **入力値の検証**
   ```go
   if user.ID == "" || user.Email == "" {
       c.JSON(http.StatusBadRequest, gin.H{"error": "Required fields missing"})
       return
   }
   ```

2. **SQLインジェクション対策**
   ```go
   // GORMのパラメータ化クエリを使用
   db.First(&user, "id = ?", userID)
   ```

## デプロイメント

### 本番環境

1. **環境変数の設定**
   - Vercel（フロントエンド）
   - Render（バックエンド）

2. **データベースの移行**
   ```bash
   supabase db push
   ```

3. **ヘルスチェック**
   ```bash
   curl -X GET https://your-backend.onrender.com/health
   ```

### 監視・ログ

1. **エラーログの監視**
   - Renderのログ
   - Vercelのログ

2. **パフォーマンス監視**
   - レスポンス時間
   - エラー率
   - データベース接続数

## トラブルシューティング

### よくある問題

1. **認証エラー**
   - 環境変数の確認
   - トークンの有効期限
   - Supabase設定の確認

2. **データベース接続エラー**
   - 接続文字列の確認
   - ファイアウォール設定
   - 認証情報の確認

3. **Prepared Statementエラー**
   - サーバーの再起動
   - 接続プールの設定確認
   - 並行処理の確認

### デバッグ手順

1. **ログの確認**
2. **環境変数の確認**
3. **ネットワーク接続の確認**
4. **データベース接続の確認**
5. **コードの確認**

## 貢献ガイドライン

### 開発フロー

1. **ブランチの作成**
   ```bash
   git checkout -b feature/user-sync-refactor
   ```

2. **変更の実装**
   - 機能の実装
   - テストの追加
   - ドキュメントの更新

3. **プルリクエストの作成**
   - 変更内容の説明
   - テスト結果の確認
   - レビューの依頼

### コーディング規約

1. **Go**
   - `gofmt`によるフォーマット
   - `golint`によるリント
   - エラーハンドリングの徹底

2. **TypeScript**
   - ESLintによるリント
   - Prettierによるフォーマット
   - 型安全性の確保

3. **コミットメッセージ**
   ```
   feat: add user sync functionality
   fix: resolve prepared statement error
   docs: update API documentation
   ``` 