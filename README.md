# Amarimono - レシピ管理システム

Amarimonoは、最新の技術を使用して構築されたフルスタックのレシピ管理システムです。ユーザーは材料の追跡、栄養情報、ユーザーレビューなどの機能を備えたレシピを作成、共有、管理することができます。

## 🚀 機能

- **レシピ管理**: レシピの作成、編集、共有
- **材料管理**: 材料とその量の管理
- **栄養情報**: レシピの栄養価の追跡
- **ユーザーレビュー**: レシピの評価とレビュー
- **ユーザープロファイル**: ユーザー設定と好みのカスタマイズ
- **レスポンシブデザイン**: デスクトップとモバイルデバイスに対応

## 🛠 技術スタック

### フロントエンド
- **フレームワーク**: Next.js
- **言語**: TypeScript
- **UIライブラリ**: React
- **スタイリング**: CSS Modules
- **デプロイ**: Vercel

### バックエンド
- **フレームワーク**: Go/Gin
- **言語**: Go
- **データベース**: PostgreSQL
- **キャッシュ**: Redis
- **デプロイ**: Render

### インフラストラクチャ
- **コンテナ化**: Docker
- **オーケストレーション**: Docker Compose
- **データベース**: Supabase (本番環境)
- **開発用データベース**: PostgreSQL (ローカル)

## 📋 必要条件

- Docker
- Docker Compose
- Go 1.21以上
- Node.js 18以上
- npmまたはyarn

## 🚀 始め方

### 1. リポジトリのクローン

```bash
git clone https://github.com/yourusername/portfolio-amarimono.git
cd portfolio-amarimono
```

### 2. 環境設定

ルートディレクトリに`.env`ファイルを作成し、以下の変数を設定します：

```env
# データベース設定
DB_HOST=db
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password
DB_NAME=amarimono

# Supabase設定
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_DB_PASSWORD=your_supabase_db_password

# OpenAI設定（オプション）
OPENAI_API_KEY=your_openai_api_key

# フロントエンド設定
NEXT_PUBLIC_BACKEND_URL=http://localhost:8080
NEXT_PUBLIC_BACKEND_INTERNAL_URL=http://backend:8080
NEXT_PUBLIC_IMAGE_BASE_URL=http://backend:8080
```

### 3. 開発環境の起動

```bash
# すべてのサービスを起動
docker compose up --build

# 特定のサービスを起動
docker compose up frontend --build
docker compose up backend --build -d
docker compose up db --build -d
```

### 4. アプリケーションへのアクセス

- フロントエンド: http://localhost:3000
- バックエンドAPI: http://localhost:8080
- データベース: localhost:5432

## 📦 データベース管理

### ローカル開発

アプリケーションはローカル開発にPostgreSQLを使用しています。以下のコマンドでデータベースにアクセスできます：

```bash
# データベースコンテナにアクセス
docker compose exec db psql -U postgres -d amarimono

# マイグレーションの実行
docker compose exec backend migrate -database "postgres://postgres:password@db:5432/amarimono?sslmode=disable" -path db/migrations up
```

### 本番環境（Supabase）

ローカルデータベースをSupabaseと同期するには：

```bash
# データベースダンプの作成
./dump-db.sh

# スクリプトのプロンプトに従ってSupabaseにリストア
```

## 🔧 開発ツール

### VS Codeタスク

プロジェクトには一般的な操作のためのVS Codeタスクが含まれています：

1. **Database: Dump**
   - データベースダンプを作成し、オプションでSupabaseにリストア

2. **Database: Migrate Up**
   - 保留中のすべてのデータベースマイグレーションを実行

3. **Database: Migrate Down**
   - 最後のデータベースマイグレーションをロールバック

## 🚀 デプロイ

### フロントエンド（Vercel）

1. メインブランチに変更をプッシュ
2. Vercelが自動的に変更をデプロイ

### バックエンド（Render）

1. メインブランチに変更をプッシュ
2. Renderが自動的に変更をデプロイ

### データベース（Supabase）

1. `dump-db.sh`スクリプトを使用してデータベースダンプを作成
2. プロンプトに従ってSupabaseにリストア

## 📚 APIドキュメント

バックエンドサービスが実行されている場合、`http://localhost:8080/docs`でAPIドキュメントを利用できます。

## 🛠 開発ガイドライン

### コードスタイル

- フロントエンド: Next.jsとReactのベストプラクティスに従う
- バックエンド: GoのベストプラクティスとGinフレームワークのガイドラインに従う

### Gitワークフロー

1. 機能ごとに新しいブランチを作成
2. 変更を加える
3. プルリクエストを作成
4. コードレビューを受ける
5. メインにマージ

## 🤝 コントリビューション

1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. ブランチにプッシュ
5. プルリクエストを作成

## 📝 ライセンス

このプロジェクトはMITライセンスの下で公開されています - [LICENSE](LICENSE)ファイルの詳細を参照してください。

## 🙏 謝辞

- [Gin](https://gin-gonic.com/) - Go用Webフレームワーク
- [Next.js](https://nextjs.org/) - Reactフレームワーク
- [Supabase](https://supabase.com/) - バックエンドサービス
- [PostgreSQL](https://www.postgresql.org/) - データベース
- [Redis](https://redis.io/) - キャッシュ

vercel（フロントエンド）
https://vercel.com/hayatookamuras-projects/portfolio-amarimono

render（バックエンド、データベース）
https://dashboard.render.com/