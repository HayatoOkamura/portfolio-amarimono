# Cloudflare R2 移行 TODO

## 概要
Supabase Storageの5GB bandwidth制限を回避するため、Cloudflare R2への移行を実施します。

## 前提条件
- Cloudflareアカウント
- 既存のSupabase Storageの画像データ
- 現在の環境変数設定

---

## 1. Cloudflare R2 セットアップ

### 1.1 Cloudflare R2バケットの作成
- [ ] Cloudflareダッシュボードにログイン
- [ ] R2 セクションに移動
- [ ] 新しいバケットを作成
  - バケット名: `amarimono-images`
  - リージョン: `Auto` (推奨)
- [ ] バケットの設定を確認
  - パブリックアクセス: 有効
  - カスタムドメイン: 必要に応じて設定

### 1.2 API トークンの作成
- [ ] Cloudflareダッシュボードで「My Profile」→「API Tokens」
- [ ] 「Create Token」をクリック
- [ ] 「Custom token」を選択
- [ ] 権限設定:
  - Account > Cloudflare R2 > Edit
  - Zone > Zone > Read
- [ ] トークンを生成し、安全に保存

### 1.3 環境変数の設定

#### バックエンド (.env)
```env
# Cloudflare R2設定
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_access_key_id
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_secret_access_key
CLOUDFLARE_R2_BUCKET_NAME=amarimono-images
CLOUDFLARE_R2_ENDPOINT=https://your_account_id.r2.cloudflarestorage.com
CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

#### フロントエンド (.env.local)
```env
# Cloudflare R2設定
NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

---

## 2. バックエンド (Go) の修正

### 2.1 依存関係の追加
- [ ] `backend/go.mod`に以下を追加:
```go
require (
    github.com/aws/aws-sdk-go-v2 v1.21.0
    github.com/aws/aws-sdk-go-v2/config v1.18.42
    github.com/aws/aws-sdk-go-v2/credentials v1.13.40
    github.com/aws/aws-sdk-go-v2/service/s3 v1.38.5
)
```

### 2.2 新しい画像アップロード関数の作成
- [ ] `backend/handlers/utils/r2_storage.go`を作成
```go
package utils

import (
    "bytes"
    "context"
    "fmt"
    "io"
    "mime/multipart"
    "os"
    "path/filepath"
    "strings"
    "time"

    "github.com/gin-gonic/gin"
    "github.com/google/uuid"
    "github.com/sirupsen/logrus"
    "github.com/aws/aws-sdk-go-v2/aws"
    "github.com/aws/aws-sdk-go-v2/config"
    "github.com/aws/aws-sdk-go-v2/credentials"
    "github.com/aws/aws-sdk-go-v2/service/s3"
)

var log = logrus.New()

// R2Client R2クライアントの構造体
type R2Client struct {
    client *s3.Client
    bucket string
    publicURL string
}

// NewR2Client R2クライアントを初期化
func NewR2Client() (*R2Client, error) {
    accountID := os.Getenv("CLOUDFLARE_R2_ACCOUNT_ID")
    accessKeyID := os.Getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
    secretAccessKey := os.Getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
    endpoint := os.Getenv("CLOUDFLARE_R2_ENDPOINT")
    bucket := os.Getenv("CLOUDFLARE_R2_BUCKET_NAME")
    publicURL := os.Getenv("CLOUDFLARE_R2_PUBLIC_URL")

    if accountID == "" || accessKeyID == "" || secretAccessKey == "" || endpoint == "" || bucket == "" {
        return nil, fmt.Errorf("R2 environment variables not properly configured")
    }

    // カスタム設定でAWS SDKを設定
    customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
        return aws.Endpoint{
            URL: endpoint,
        }, nil
    })

    cfg, err := config.LoadDefaultConfig(context.TODO(),
        config.WithEndpointResolverWithOptions(customResolver),
        config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(
            accessKeyID,
            secretAccessKey,
            "",
        )),
        config.WithRegion("auto"),
    )
    if err != nil {
        return nil, fmt.Errorf("failed to load AWS config: %v", err)
    }

    client := s3.NewFromConfig(cfg)

    return &R2Client{
        client:    client,
        bucket:    bucket,
        publicURL: publicURL,
    }, nil
}

// SaveImageToR2 画像をR2に保存
func SaveImageToR2(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
    log.Printf("Starting SaveImageToR2 function with path: %s, fileName: %s", path, fileName)

    // R2クライアントを初期化
    r2Client, err := NewR2Client()
    if err != nil {
        log.Printf("Failed to initialize R2 client: %v", err)
        return "", fmt.Errorf("failed to initialize R2 client: %v", err)
    }

    // ファイルを開く
    src, err := file.Open()
    if err != nil {
        log.Printf("Failed to open file: %v", err)
        return "", fmt.Errorf("failed to open file: %v", err)
    }
    defer src.Close()

    // ファイルの内容を読み込む
    fileContent, err := io.ReadAll(src)
    if err != nil {
        log.Printf("Failed to read file content: %v", err)
        return "", fmt.Errorf("failed to read file content: %v", err)
    }

    // ファイル名を生成
    if fileName == "" {
        ext := filepath.Ext(file.Filename)
        fileName = fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
    }

    // ファイルパスを生成
    filePath := filepath.Join(path, fileName)
    filePath = strings.ReplaceAll(filePath, "\\", "/")

    // コンテンツタイプを取得
    contentType := file.Header.Get("Content-Type")
    if contentType == "" {
        contentType = "application/octet-stream"
    }

    // R2にアップロード
    _, err = r2Client.client.PutObject(context.TODO(), &s3.PutObjectInput{
        Bucket:      aws.String(r2Client.bucket),
        Key:         aws.String(filePath),
        Body:        bytes.NewReader(fileContent),
        ContentType: aws.String(contentType),
    })
    if err != nil {
        log.Printf("Failed to upload to R2: %v", err)
        return "", fmt.Errorf("failed to upload to R2: %v", err)
    }

    log.Printf("Successfully uploaded file to R2: %s", filePath)
    return filePath, nil
}

// DeleteImageFromR2 R2から画像を削除
func DeleteImageFromR2(filePath string) error {
    log.Printf("Starting DeleteImageFromR2 function with filePath: %s", filePath)

    // R2クライアントを初期化
    r2Client, err := NewR2Client()
    if err != nil {
        log.Printf("Failed to initialize R2 client: %v", err)
        return fmt.Errorf("failed to initialize R2 client: %v", err)
    }

    // R2から削除
    _, err = r2Client.client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
        Bucket: aws.String(r2Client.bucket),
        Key:    aws.String(filePath),
    })
    if err != nil {
        log.Printf("Failed to delete from R2: %v", err)
        return fmt.Errorf("failed to delete from R2: %v", err)
    }

    log.Printf("Successfully deleted file from R2: %s", filePath)
    return nil
}

// GetR2PublicURL R2の公開URLを生成
func GetR2PublicURL(filePath string) string {
    publicURL := os.Getenv("CLOUDFLARE_R2_PUBLIC_URL")
    if publicURL == "" {
        return ""
    }
    return fmt.Sprintf("%s/%s", publicURL, filePath)
}
```

### 2.3 既存の画像アップロード関数の更新
- [ ] `backend/handlers/utils/image.go`を更新
  - `SaveImage`関数をR2対応に変更
  - `DeleteImage`関数をR2対応に変更
  - 環境変数でSupabase/R2を切り替え可能にする

```go
// SaveImage は画像を保存し、URLを返す（R2対応）
func SaveImage(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
    // 環境変数でストレージを切り替え
    storageType := os.Getenv("STORAGE_TYPE")
    if storageType == "r2" {
        return SaveImageToR2(c, file, path, fileName)
    }
    
    // 既存のSupabase実装（フォールバック）
    return SaveImageToSupabase(c, file, path, fileName)
}

// DeleteImage は画像を削除する（R2対応）
func DeleteImage(url string) error {
    storageType := os.Getenv("STORAGE_TYPE")
    if storageType == "r2" {
        // URLからファイルパスを抽出
        filePath := extractFilePathFromURL(url)
        return DeleteImageFromR2(filePath)
    }
    
    // 既存のSupabase実装（フォールバック）
    return DeleteImageFromSupabase(url)
}
```

### 2.4 環境変数の追加
- [ ] `.env`に以下を追加:
```env
# ストレージ設定
STORAGE_TYPE=r2  # r2 または supabase
```

---

## 3. フロントエンド (Next.js) の修正

### 3.1 画像URL生成関数の更新
- [ ] `frontend/app/utils/api.ts`を更新
```typescript
export const imageBaseUrl = typeof window !== 'undefined'
  ? (() => {
      const currentHost = window.location.hostname;
      
      // 開発環境の場合
      if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        return 'http://localhost:54321/storage/v1/object/public/images';
      }
      
      // ローカルネットワークの場合
      if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
        return `http://${currentHost}:54321/storage/v1/object/public/images`;
      }
      
      // 本番環境ではCloudflare R2のURLを使用
      if (currentHost === 'amarimono.okamura.dev') {
        return process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev';
      }
      
      // その他の場合は環境変数を使用
      return process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev';
    })()
  : process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev';
```

### 3.2 画像コンポーネントの更新
- [ ] `frontend/app/components/features/recipe/RecipeImage.tsx`を更新
```typescript
export default function RecipeImage({ src, alt, width = 256, height = 256 }: RecipeImageProps) {
    const imageUrl = useMemo(() => {
        if (typeof window !== 'undefined') {
            const currentHost = window.location.hostname;
            
            // 開発環境の場合
            if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                return `http://localhost:54321/storage/v1/object/public/images/${src}`;
            }
            
            // ローカルネットワークの場合
            if (currentHost.match(/^192\.168\./) || currentHost.match(/^10\./) || currentHost.match(/^172\./)) {
                return `http://${currentHost}:54321/storage/v1/object/public/images/${src}`;
            }
            
            // 本番環境ではCloudflare R2のURLを使用
            if (process.env.ENVIRONMENT === 'production') {
                return `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL}/${src}`;
            } else {
                return `${process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL}/${src}`;
            }
        } else {
            // サーバーサイドでは環境変数を使用
            if (process.env.ENVIRONMENT === 'production') {
                return `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL}/${src}`;
            } else {
                return `${process.env.NEXT_PUBLIC_LOCAL_IMAGE_URL}/${src}`;
            }
        }
    }, [src]);

    return (
        <Image
            src={imageUrl}
            alt={alt}
            width={width}
            height={height}
            className="object-cover rounded-lg"
        />
    );
}
```

### 3.3 Next.js設定の更新
- [ ] `frontend/next.config.js`を更新
```javascript
const nextConfig = {
  images: {
    remotePatterns: process.env.ENVIRONMENT === 'development' 
      ? [
          // 開発環境ではすべてのローカルホストを許可
          {
            protocol: 'http',
            hostname: 'localhost',
            port: '8080',
            pathname: '/uploads/**',
          },
          {
            protocol: 'http',
            hostname: 'localhost',
            port: '54321',
            pathname: '/storage/v1/object/public/images/**',
          },
          // ... 他の開発環境設定
        ]
      : [
          // 本番環境ではCloudflare R2のURLを許可
          {
            protocol: 'https',
            hostname: 'amarimono-backend.onrender.com',
            port: '',
            pathname: '/uploads/**',
          },
          {
            protocol: 'https',
            hostname: 'api.okamura.dev',
            port: '',
            pathname: '/uploads/**',
          },
          {
            protocol: 'https',
            hostname: 'pub-xxxxx.r2.dev', // Cloudflare R2のドメイン
            port: '',
            pathname: '/**',
          }
        ],
    // ... 他の設定
  },
  env: {
    // ... 既存の設定
    IMAGE_BASE_URL: process.env.ENVIRONMENT === 'development'
      ? 'http://localhost:54321/storage/v1/object/public/images'
      : process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL || 'https://pub-xxxxx.r2.dev',
  },
  // ... 他の設定
};
```

---

## 4. 既存データの移行

### 4.1 移行スクリプトの作成
- [x] `scripts/migrate_images_to_r2.py`を作成
- [x] `scripts/check_images.sql`を作成（移行対象確認用）
- [x] `scripts/manual_migration_guide.md`を作成（手動移行ガイド）
- [x] `scripts/requirements.txt`を更新（必要なパッケージ追加）

### 4.2 移行実行
- [ ] 移行対象の確認（SQLクエリ実行）
- [ ] ドライランの実行（テスト移行）
- [ ] 実際の移行実行
- [ ] 移行結果の確認
- [ ] エラーが発生した画像を手動で対応

### 4.3 手動移行の手順
1. **移行対象の確認**
   ```bash
   docker compose exec db psql -U postgres -d amarimono
   \i scripts/check_images.sql
   ```

2. **小規模テスト移行**
   ```bash
   cd scripts
   python migrate_images_to_r2.py
   # プロンプトで 'y' を入力してドライラン実行
   ```

3. **実際の移行実行**
   ```bash
   python migrate_images_to_r2.py
   # プロンプトで 'n' を入力して実際の移行実行
   ```

4. **手動移行（必要に応じて）**
   - Supabaseダッシュボードから画像をダウンロード
   - Cloudflare R2に手動でアップロード
   - データベースのパスを手動で更新

---

## 5. テストと検証

### 5.1 開発環境でのテスト
- [ ] ローカル環境でR2設定をテスト
- [ ] 画像アップロード機能をテスト
- [ ] 画像表示機能をテスト
- [ ] 画像削除機能をテスト

### 5.2 本番環境でのテスト
- [ ] 環境変数を本番環境に設定
- [ ] 段階的にR2に切り替え
- [ ] 既存画像の表示を確認
- [ ] 新規画像アップロードをテスト

### 5.3 パフォーマンステスト
- [ ] 画像読み込み速度を測定
- [ ] CDNの効果を確認
- [ ] エラーレートを監視

---

## 6. 切り替えとクリーンアップ

### 6.1 段階的切り替え
- [ ] 環境変数で`STORAGE_TYPE=r2`に設定
- [ ] 新規アップロードをR2に切り替え
- [ ] 既存画像の移行を完了
- [ ] 完全にR2に切り替え

### 6.2 Supabase Storageのクリーンアップ
- [ ] 移行完了後、Supabase Storageの画像を削除
- [ ] Supabase Storageの使用量を確認
- [ ] 必要に応じてSupabase Storageの設定を調整

---

## 7. 監視とメンテナンス

### 7.1 監視設定
- [ ] Cloudflare R2の使用量監視
- [ ] エラーログの監視
- [ ] パフォーマンスメトリクスの設定

### 7.2 バックアップ戦略
- [ ] R2のバックアップ設定
- [ ] 災害復旧計画の策定

---

## 注意事項

1. **段階的移行**: 一度にすべてを切り替えるのではなく、段階的に移行する
2. **バックアップ**: 移行前に既存データのバックアップを取得
3. **テスト**: 各段階で十分なテストを実施
4. **ロールバック**: 問題が発生した場合のロールバック手順を準備
5. **ドキュメント**: 設定変更をドキュメント化

---

## 完了チェックリスト

- [ ] Cloudflare R2バケットの作成
- [ ] APIトークンの設定
- [ ] 環境変数の設定
- [ ] バックエンドコードの更新
- [ ] フロントエンドコードの更新
- [ ] 既存データの移行
- [ ] テストの実施
- [ ] 本番環境での動作確認
- [ ] Supabase Storageのクリーンアップ
- [ ] 監視設定の完了 