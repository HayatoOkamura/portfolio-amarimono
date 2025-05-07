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

### dump-db.shの管理

`dump-db.sh`スクリプトは、ローカルデータベースの内容をSupabaseに同期するための重要なツールです。以下の点に注意して管理してください：

1. **スキーマの変更時**
   - 新しいテーブルの追加
   - 既存テーブルのカラム変更
   - 外部キー制約の追加や変更
   これらの変更がある場合は、`dump-db.sh`のスキーマ定義部分を更新する必要があります。

2. **外部キー制約の動作**
   - `ON DELETE CASCADE`: 親レコードが削除されたときに子レコードも削除
   - `ON DELETE SET NULL`: 親レコードが削除されたときに子レコードの外部キーをNULLに設定
   - これらの動作は、`dump-db.sh`のスキーマ定義で明示的に指定されています

3. **定期的なメンテナンス**
   - データベースの構造が変更された場合のみ修正が必要
   - 通常のデータ同期では修正は不要
   - 変更時は、ローカルとSupabaseの両方で同じ動作になることを確認

4. **バックアップ**
   - スクリプトを変更する前に必ずバックアップを作成
   - 変更後はテスト環境で動作確認を実施

5. **トラブルシューティング**
   - 同期に失敗した場合は、生成されたダンプファイルを確認
   - スキーマ定義と実際のデータベース構造が一致しているか確認
   - 外部キー制約の動作が期待通りか確認

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

# レンダリング戦略

このプロジェクトでは、Next.jsの様々なレンダリング方法を組み合わせて最適なパフォーマンスとUXを実現しています。

## レンダリング方法の概要

### 1. トップページ (page.tsx)
- **方法**: ISR (Incremental Static Regeneration)
- **理由**: 
  - 本番環境では具材一覧が変更されない
  - 開発環境での変更は`revalidate`で対応可能
  - 初期ロードのパフォーマンスが重要
  - SEO対策が必要
- **設定**:
  ```typescript
  export const revalidate = process.env.NODE_ENV === 'production' ? 86400 : 10; // 本番:24時間、開発:10秒
  ```

### 2. その他のページ
- **方法**: ページごとに最適なレンダリング方法を選択
  - レシピ一覧ページ: CSR (Client-Side Rendering)
    - **理由**:
      - 具材の選択状態に基づく動的な検索結果の表示
      - ユーザーのインタラクションが多い（ソート、フィルタリング）
      - リアルタイムな状態管理が必要
      - SEOの優先度は低い（検索結果はユーザー固有）
    - **実装**:
      - `page.tsx`はCSRとして実装
      - `RecipeClientComponent`でレシピ一覧と詳細を管理
      - React Queryを使用した効率的なデータフェッチング
      - Zustandによる状態管理
  - レシピ詳細ページ: ISR (Incremental Static Regeneration)
  - ユーザーページ: SSR (Server-Side Rendering)
  - 管理画面: CSR (Client-Side Rendering)

### 3. コンポーネント別のレンダリング方法

#### TopHeader
- **方法**: SG (Static Generation) + CSR (Client-Side Rendering)
- **理由**:
  - ヘッダーの基本構造は静的なため、SGが適切
  - 検索フォームはHTMLフォームとして実装（JavaScript不要）
  - ユーザー認証状態のみ動的な更新が必要
- **実装**:
  - 静的な部分はSGとして実装
  - 認証関連のみを`ClientAuthMenu`として分離

#### SideHeader
- **方法**: SG (Static Generation) + CSR (Client-Side Rendering)
- **理由**:
  - ナビゲーションリンクは静的なため、SGが適切
  - アクティブ状態はURLベースで判定可能
  - ユーザー認証状態のみ動的な更新が必要
- **実装**:
  - 静的な部分はSGとして実装
  - 認証関連のみを`ClientAuthMenu`として分離

#### IngredientSelector
- **方法**: CSR (Client-Side Rendering)
- **理由**:
  - 具材の選択状態はクライアントサイドの状態管理が必要
  - カテゴリフィルタリングはリアルタイムな更新が必要
  - ドラッグ&ドロップなどの高度なUI操作が必要
  - 数量変更などのインタラクティブな操作が必要

#### GenerateRecipe
- **方法**: CSR (Client-Side Rendering)
- **理由**:
  - 選択された具材の状態管理が必要
  - レシピ生成のトリガーとなるボタン操作が必要
  - エラーハンドリングとローディング状態の管理が必要

## データフロー

```
Server (ISR/SSR/CSR)
  ↓
各ページのpage.tsx
  ↓
initialDataをpropsとして渡す
  ↓
Client Components (CSR)
  - IngredientSelector
  - GenerateRecipe
  - ClientAuthMenu (TopHeader/SideHeader)
  - RecipeClientComponent (レシピ一覧ページ)
```

## 各レンダリング方法の利点

### SG (Static Generation)
- 最速の初期ロード
- サーバー負荷の最小化
- SEO対策
- キャッシュの最適化

### ISR (Incremental Static Regeneration)
- パフォーマンスの向上
- SEO対策
- 定期的なデータ更新
- 開発環境での柔軟な更新

### SSR (Server-Side Rendering)
- 最新のデータを常に表示
- SEO対策
- 初期ロード時のデータ整合性
- ユーザー認証の安全性

### CSR (Client-Side Rendering)
- インタラクティブなUI
- リアルタイムなデータ更新
- スムーズなユーザー体験
- 状態管理の柔軟性

## 開発時の注意点

1. サーバーコンポーネントとクライアントコンポーネントの境界を明確に
2. 静的な部分は可能な限りSGとして実装
3. 動的な部分のみをCSRとして実装
4. パフォーマンスの監視
5. 各ページの要件に応じて適切なレンダリング方法を選択

## パフォーマンス最適化

- 画像の最適化
- コード分割
- キャッシュ戦略
- バンドルサイズの最適化
- クライアントコンポーネントの最小化

## 🥗 具材管理機能

### 具材の登録プロセス

具材の登録時には以下の複雑な処理が自動的に実行されます：

1. **翻訳処理**
   - 日本語の具材名を英語に翻訳
   - `ingredient_name_mappings`テーブルを使用して翻訳を管理
   - マッピングが存在しない場合は日本語名をそのまま英語名として使用
   - 翻訳結果は`ingredients`テーブルの`english_name`カラムに保存

2. **栄養素情報の取得**
   - USDA Food Database APIを使用して栄養素情報を取得
   - 取得する栄養素：
     - カロリー (kcal)
     - タンパク質 (g)
     - 脂質 (g)
     - 炭水化物 (g)
     - 糖質 (g)
     - 塩分 (g)
   - APIから取得できない場合は手動入力が可能

3. **画像処理**
   - アップロードされた画像を最適化
   - Supabase Storageに保存
   - 画像URLをデータベースに保存

4. **データベース更新**
   - 具材の基本情報を`ingredients`テーブルに保存
   - 翻訳情報を`ingredient_name_mappings`テーブルに保存
   - 栄養素情報をJSONB形式で保存

### 具材の更新プロセス

具材の更新時には以下の処理が実行されます：

1. **名前変更時の処理**
   - 名前が変更された場合のみ翻訳を実行
   - 新しい英語名を取得して更新
   - 栄養素情報も再取得

2. **栄養素情報の更新**
   - 手動で入力された栄養素情報を更新
   - 名前変更時はUSDA APIから再取得

3. **画像の更新**
   - 新しい画像がアップロードされた場合のみ処理
   - 古い画像は自動的に削除
   - 新しい画像を最適化して保存

### エラーハンドリング

1. **翻訳エラー**
   - 翻訳APIが失敗した場合は日本語名をそのまま使用
   - エラーログを記録

2. **栄養素取得エラー**
   - USDA APIが失敗した場合は手動入力にフォールバック
   - エラーメッセージをユーザーに表示

3. **画像処理エラー**
   - 画像のアップロードに失敗した場合はエラーメッセージを表示
   - 既存の画像を保持

### パフォーマンス最適化

1. **翻訳のキャッシュ**
   - 既存の翻訳結果を再利用
   - 不要なAPI呼び出しを削減

2. **画像の最適化**
   - アップロード時に画像を最適化
   - 表示サイズに応じたリサイズ

3. **バッチ処理**
   - 大量の具材を登録する場合はバッチ処理を実装
   - API呼び出しを最適化

原因を教えてください。
原因の特定に必要な情報があれば教えてください。