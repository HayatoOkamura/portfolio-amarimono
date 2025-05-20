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

1. **栄養素情報の取得**
   - 文部科学省の食品成分データベースを使用して栄養素情報を取得
   - 取得する栄養素：
     - カロリー (kcal)
     - タンパク質 (g)
     - 脂質 (g)
     - 炭水化物 (g)
     - 食塩相当量 (g)
   - データベースに存在しない場合は手動入力が可能

2. **画像処理**
   - アップロードされた画像を最適化
   - Supabase Storageに保存
   - 画像URLをデータベースに保存

3. **データベース更新**
   - 具材の基本情報を`ingredients`テーブルに保存
   - 栄養素情報をJSONB形式で保存

### 具材の更新プロセス

具材の更新時には以下の処理が実行されます：

1. **栄養素情報の更新**
   - 手動で入力された栄養素情報を更新
   - 名前変更時は食品成分データベースから再取得

2. **画像の更新**
   - 新しい画像がアップロードされた場合のみ処理
   - 古い画像は自動的に削除
   - 新しい画像を最適化して保存

### エラーハンドリング

1. **栄養素取得エラー**
   - 食品成分データベースに存在しない場合は手動入力にフォールバック
   - エラーメッセージをユーザーに表示

2. **画像処理エラー**
   - 画像のアップロードに失敗した場合はエラーメッセージを表示
   - 既存の画像を保持

### パフォーマンス最適化

1. **画像の最適化**
   - アップロード時に画像を最適化
   - 表示サイズに応じたリサイズ

2. **バッチ処理**
   - 大量の具材を登録する場合はバッチ処理を実装

## 🐍 Pythonスクリプト

### 食品成分データの変換

食品成分データベースのExcelファイルをJSON形式に変換するPythonスクリプトを提供しています。

#### 必要条件

- Python 3.8以上
- 必要なパッケージ（`scripts/requirements.txt`）：
  ```
  pandas==2.2.1
  openpyxl==3.1.2
  ```

#### セットアップ

1. 仮想環境の作成と有効化：
   ```bash
   cd scripts
   python3 -m venv venv
   source venv/bin/activate  # macOS/Linux
   # または
   .\venv\Scripts\activate  # Windows
   ```

2. 必要なパッケージのインストール：
   ```bash
   pip install -r requirements.txt
   ```

3. 文部科学省の食品成分データベースからダウンロードしたExcelファイル（`02_本表.xlsx`）を`scripts/data`ディレクトリに配置

#### 使用方法

1. スクリプトの実行：
   ```bash
   python convert_food_data.py
   ```

2. 変換されたJSONファイルは`frontend/app/utils/foodData.json`に出力されます

#### スクリプトの機能

1. **データの読み込み**
   - Excelファイルから食品成分データを読み込み
   - ヘッダー行を適切に処理
   - 特殊な数値形式（`-`、`Tr`、括弧付き数値など）を処理

2. **データの検証**
   - 必要な列の存在確認
   - データの空チェック
   - 数値の形式チェック

3. **データの変換**
   - 食品名、カロリー、タンパク質、脂質、炭水化物、食塩相当量を抽出
   - 特殊な数値形式を適切な数値に変換
   - JSON形式に整形

4. **エラー処理**
   - ファイルの存在チェック
   - データ形式の検証
   - エラーログの出力

#### 出力形式

```json
{
  "食品名": {
    "name": "食品名",
    "calories": 数値,
    "protein": 数値,
    "fat": 数値,
    "carbohydrates": 数値,
    "salt": 数値
  },
  ...
}
```

#### 注意点

1. **データの更新**
   - 食品成分データベースが更新された場合は、新しいExcelファイルをダウンロードして変換を実行
   - 変換後はフロントエンドアプリケーションを再ビルド

2. **エラー対応**
   - 変換中にエラーが発生した場合は、ログを確認して原因を特定
   - 必要に応じてスクリプトを修正

3. **パフォーマンス**
   - 大量のデータを処理する場合は、メモリ使用量に注意
   - 必要に応じてバッチ処理を実装

## Pythonスクリプトの使用方法

### 仮想環境の操作方法

1. 仮想環境の作成：
```bash
python -m venv venv
```

2. 仮想環境の有効化：
- macOSの場合：
```bash
source venv/bin/activate
```
- Windowsの場合：
```bash
venv\Scripts\activate
```

3. 仮想環境の終了：
```bash
deactivate
```

4. 仮想環境内でのパッケージ管理：
- パッケージのインストール：
```bash
pip install <パッケージ名>
```
- インストール済みパッケージの確認：
```bash
pip list
```
- パッケージのアンインストール：
```bash
pip uninstall <パッケージ名>
```

5. 仮想環境の削除：
- 仮想環境を終了した後、`venv`ディレクトリを削除：
```bash
rm -rf venv  # macOSの場合
```

### 仮想環境を使用する利点
- プロジェクトごとに独立したPython環境を維持できる
- パッケージの依存関係の競合を防ぐ
- プロジェクトの再現性を確保できる

### 注意点
- 仮想環境を有効にしている間は、プロンプトに`(venv)`と表示されます
- これは正常な動作で、現在仮想環境が有効であることを示しています
- 仮想環境を終了したい場合は`deactivate`コマンドを使用してください

## 🎨 UIコンポーネント

### Loading Components

アプリケーション全体で使用されるローディング状態を表示するためのコンポーネント群です。

#### 1. Loading.tsx
基本的なローディングアニメーションを表示するコンポーネント。
- Lottieアニメーションを使用
- シンプルなローディング表示に使用
- ページ遷移時やデータ読み込み時に表示

#### 2. RecipeLoading.tsx
レシピ生成時の専用ローディングコンポーネント。
- プログレスバー付きのローディング表示
- レシピ生成の進捗状況を表示
- 専用のLottieアニメーションを使用

#### 3. PageLoading.tsx
ページ全体のローディング状態を管理するラッパーコンポーネント。
- 子コンポーネントのローディング状態を制御
- 一貫性のあるローディング表示を提供
- 再利用可能なローディングUI

#### 使用方法

```typescript
// 基本的なローディング表示
import Loading from '@/app/components/ui/Loading/Loading';
<Loading />

// レシピ生成時のローディング
import RecipeLoading from '@/app/components/ui/Loading/RecipeLoading';
<RecipeLoading />

// ページ全体のローディング
import { PageLoading } from '@/app/components/ui/Loading/PageLoading';
const YourPage = () => {
  const { isLoading } = useYourStore();
  return (
    <PageLoading isLoading={isLoading}>
      {/* ページのコンテンツ */}
    </PageLoading>
  );
};
```

#### 注意事項

1. **ローディング状態の管理**
   - ページ遷移時は`loading.tsx`（Next.jsの機能）が使用される
   - データ取得時は`PageLoading`コンポーネントを使用
   - レシピ生成時は`RecipeLoading`コンポーネントを使用

2. **スタイリング**
   - ローディング表示は中央揃え
   - 画面全体の高さを確保（minHeight: 100vh）
   - レスポンシブ対応済み

3. **パフォーマンス**
   - Lottieアニメーションは最適化済み
   - 不要な再レンダリングを防ぐため、適切な場所で使用

## 👑 管理者権限機能

### 管理者権限の概要

Amarimonoでは、以下の機能を持つ管理者権限を実装しています：

1. **ユーザー管理**
   - ユーザーの一覧表示
   - ユーザーの権限変更
   - ユーザーのアカウント停止/有効化

2. **コンテンツ管理**
   - レシピの承認/却下
   - 不適切なコンテンツの削除
   - 具材データの管理

3. **システム管理**
   - システム設定の変更
   - バックアップの管理
   - ログの確認

### 管理者権限の実装

#### 1. データベース設計

```sql
-- ユーザーテーブルに管理者フラグを追加
ALTER TABLE users ADD COLUMN is_admin BOOLEAN DEFAULT false;

-- 管理者ログテーブル
CREATE TABLE admin_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(50) NOT NULL,
    target_id INTEGER NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. バックエンド実装

- 管理者専用のAPIエンドポイント
- 権限チェックミドルウェア
- 管理者アクションのログ記録

#### 3. フロントエンド実装

- 管理者専用のダッシュボード
- 権限に基づくUI表示の制御
- 管理者アクションの確認ダイアログ

### 管理者権限の使用イメージ

#### 1. ダッシュボード

管理者は専用のダッシュボードから以下の操作が可能です：

- ユーザー管理
  - ユーザー一覧の表示
  - 権限の変更
  - アカウントの停止/有効化

- コンテンツ管理
  - 新規レシピの承認待ち一覧
  - 報告されたコンテンツの確認
  - 具材データの編集

- システム管理
  - システム設定の変更
  - バックアップの作成/復元
  - アクセスログの確認

#### 2. 権限レベル

管理者権限は以下のレベルで実装されています：

1. **スーパー管理者**
   - すべての機能にアクセス可能
   - 他の管理者の権限を変更可能
   - システム設定の変更可能

2. **コンテンツ管理者**
   - レシピの承認/却下
   - 不適切なコンテンツの削除
   - 具材データの管理

3. **ユーザー管理者**
   - ユーザーアカウントの管理
   - ユーザー権限の変更
   - ユーザー関連のログ確認

#### 3. セキュリティ対策

- 管理者アクションの二要素認証
- アクションのログ記録
- 定期的な権限の見直し
- セッション管理の強化

### 管理者権限の設定方法

1. **初期設定**
   ```bash
   # データベースで管理者ユーザーを設定
   docker compose exec db psql -U postgres -d amarimono -c "UPDATE users SET is_admin = true WHERE email = 'admin@example.com';"
   ```

2. **権限の付与**
   - 管理者ダッシュボードから権限を付与
   - または、データベースで直接設定

3. **権限の確認**
   - 管理者ダッシュボードで権限を確認
   - ログで権限変更履歴を確認

### 注意事項

1. **セキュリティ**
   - 管理者アカウントのパスワードは定期的に変更
   - アクセスログを定期的に確認
   - 不審なアクティビティを監視

2. **バックアップ**
   - 重要な操作前にバックアップを作成
   - 定期的なバックアップの実施
   - バックアップの検証

3. **運用**
   - 管理者権限の付与は慎重に
   - 定期的な権限の見直し
   - 不要な権限の削除