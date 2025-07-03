# Amarimono API ドキュメント

## 概要

AmarimonoのバックエンドAPIは、Go/Ginフレームワークを使用して構築されており、RESTful設計に従っています。

## ベースURL

- **開発環境**: `http://localhost:8080`
- **本番環境**: `https://your-backend-url.onrender.com`

## 認証

APIリクエストには、Supabaseのアクセストークンが必要です。

```http
Authorization: Bearer <supabase-access-token>
```

## ユーザー管理API（移行完了版）

### エンドポイント一覧
- `POST /api/users` - ユーザー新規作成（純粋な作成のみ）
- `POST /api/users/sync` - ユーザー同期処理（作成・更新）
- `GET /api/users/:id` - ユーザー情報取得（純粋な取得）
- `GET /api/users/:id/profile` - ユーザープロフィール取得（ロール情報付き）
- `PUT /api/users/:id` - ユーザープロフィール更新

### 設計思想
- **責任の分離**: 取得、作成、同期、更新の処理を明確に分離
- **直感的な命名**: 関数名が実際の処理と一致
- **エラーハンドリング**: 適切なエラーメッセージとリトライ機能
- **prepared statement対策**: 本番環境での並行処理に対応

### 移行完了
- ✅ ユーザー同期機能のリファクタリング完了
- ✅ 古いAPIエンドポイントの削除完了
- ✅ 関数の責任分離完了
- ✅ エラーハンドリングの改善完了

### ユーザー情報の取得

#### GET /api/users/:id

指定されたIDのユーザー情報を取得します。

**パラメータ**
- `id` (string, required): ユーザーID

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/image.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `200 OK`: 成功
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: サーバーエラー

### ユーザー情報の同期

#### POST /api/users/sync

Supabaseの認証情報とバックエンドDBのユーザー情報を同期します。存在しない場合は作成、存在する場合は更新します。

**リクエストボディ**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性"
}
```

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/image.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `200 OK`: 同期成功
- `400 Bad Request`: リクエストデータが不正
- `500 Internal Server Error`: サーバーエラー

### 新規ユーザーの作成

#### POST /api/users

新規ユーザーを作成します（同期処理は含まれません）。

**リクエストボディ**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性"
}
```

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/image.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `201 Created`: 作成成功
- `400 Bad Request`: リクエストデータが不正
- `500 Internal Server Error`: サーバーエラー

### ユーザープロファイルの更新

#### PUT /api/users/:id

指定されたIDのユーザープロファイルを更新します。

**パラメータ**
- `id` (string, required): ユーザーID

**リクエストボディ** (multipart/form-data)
```
username: "new-username"
age: "25"
gender: "男性"
image: [ファイル] (オプション)
```

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "new-username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/new-image.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `200 OK`: 更新成功
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: サーバーエラー

### ユーザープロファイルの取得（ロール情報付き）

#### GET /api/users/:id/profile

指定されたIDのユーザープロファイルをロール情報と共に取得します。

**パラメータ**
- `id` (string, required): ユーザーID

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/image.jpg",
  "role": "user",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `200 OK`: 成功
- `404 Not Found`: ユーザーが見つからない
- `500 Internal Server Error`: サーバーエラー

## 認証API

### ユーザーロールの取得

#### GET /api/auth/role

現在のユーザーのロールを取得します。

**レスポンス**
```json
{
  "role": "user"
}
```

**ステータスコード**
- `200 OK`: 成功
- `401 Unauthorized`: 認証が必要
- `500 Internal Server Error`: サーバーエラー

## フロントエンドAPI

### 認証同期

#### POST /api/auth/sync

フロントエンドからバックエンドへの認証同期を行います。

**リクエストヘッダー**
```http
Authorization: Bearer <supabase-access-token>
```

**レスポンス**
```json
{
  "id": "user-id",
  "email": "user@example.com",
  "username": "username",
  "age": 25,
  "gender": "男性",
  "profile_image": "https://example.com/image.jpg",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

**ステータスコード**
- `200 OK`: 同期成功
- `401 Unauthorized`: 認証が必要
- `403 Forbidden`: メール認証が完了していない
- `500 Internal Server Error`: サーバーエラー

## エラーレスポンス

### エラーレスポンスの形式

```json
{
  "error": "エラーメッセージ",
  "details": "詳細なエラー情報（オプション）"
}
```

### よくあるエラー

#### 400 Bad Request
- リクエストデータが不正
- 必須フィールドが不足

#### 401 Unauthorized
- 認証トークンが無効
- 認証トークンが不足

#### 403 Forbidden
- メール認証が完了していない
- 権限が不足

#### 404 Not Found
- リソースが見つからない

#### 500 Internal Server Error
- サーバー内部エラー
- データベースエラー
- Prepared statementエラー

## 設計思想

### 責任の分離

1. **取得専用関数**
   - `GetUserByID`: 純粋なユーザー情報取得
   - エラー時はそのまま返す

2. **同期専用関数**
   - `SyncUser`: SupabaseとバックエンドDBの同期
   - 存在しない場合は作成、存在する場合は更新

3. **作成専用関数**
   - `CreateUser`: 新規ユーザー作成
   - 重複エラーは別途処理

### エラーハンドリング

1. **Prepared Statementエラー**
   - 本番環境での並行処理による重複
   - リトライ機能で対応

2. **重複キーエラー**
   - ユーザーが既に存在する場合
   - 適切な再取得処理

3. **ネットワークエラー**
   - タイムアウト設定
   - 接続プールの最適化

## 開発・テスト

### テスト実行

```bash
# バックエンドテスト
cd backend
go test ./...

# フロントエンドテスト
cd frontend
npm test
```

### ローカル開発

```bash
# バックエンドサーバー起動
cd backend
go run main.go

# フロントエンドサーバー起動
cd frontend
npm run dev
```

### APIドキュメントの確認

バックエンドサーバー起動後、以下のURLでSwaggerドキュメントを確認できます：

```
http://localhost:8080/docs
``` 