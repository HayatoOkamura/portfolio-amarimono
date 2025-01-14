# portfolio-amarimono

このプロジェクトは、backend（Go/Gin ベース）、frontend（Next.js ベース）、および db（PostgreSQL）のサービスを含む Docker Compose を使用したマルチコンテナアプリケーションです。

## 環境構成
### サービス一覧
backend

ポート: 8080
機能: API サーバー（Go/Gin）
ビルド元: ./backend/Dockerfile
frontend

ポート: 3000
機能: フロントエンド（Next.js）
ビルド元: ./frontend/Dockerfile
db

イメージ: postgres:17-alpine
ポート: 5432
機能: データベース
初期化スクリプト: ./backend/db/migrations


## セットアップ手順
### 1. 必要条件
以下がインストールされている必要があります：

Docker
Docker Compose
### 2. プロジェクトのクローン
リポジトリをローカル環境にクローンします。

bash
コードをコピーする
git clone <リポジトリのURL>
cd <プロジェクトディレクトリ>

## 起動方法
Docker Composeを使用してコンテナを起動 プロジェクトルートで以下のコマンドを実行します：

### フロントエンド
docker compose up frontend --build

### バックエンド
docker compose up backend --build -d

### DB
docker compose up db --build -d

## アクセス方法
### フロントエンド
URL: http://localhost:3000
### バックエンド
URL: http://localhost:8080
### データベース
ホスト: localhost
ポート: 5432
ユーザー: postgres
パスワード: password
データベース名: db
## 停止方法
サービスを停止するには：

bash
コードをコピーする
docker compose down
ボリュームも含めて削除する場合は以下を実行します：

bash
コードをコピーする
docker compose down -v

## その他コマンド

### execによるアクセス
### バックエンド
docker compose exec backend sh

## DB
### dbコンテナに入る
docker exec　-it <container_id> sh

### sqlコマンドを使用
psql -U postgres -x db

### カラム確認
\d ingredients;

## 開発時の注意
ホットリロード
backend と frontend のコードは、それぞれローカルの ./backend および ./frontend ディレクトリをマウントしているため、ローカルファイルの変更がコンテナに即時反映されます。
Node_modules の管理
frontend サービスでは、front_node_modules ボリュームを使用して node_modules ディレクトリを管理しています。ローカル環境で直接操作する必要はありません。
トラブルシューティング
1. ポート競合エラー
他のアプリケーションがポート 3000, 8080, または 5432 を使用している場合、競合が発生します。docker-compose.yml のポート設定を変更してください。
