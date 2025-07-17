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

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
)

var r2Log = logrus.New()

// R2Client R2クライアントの構造体
type R2Client struct {
	client    *s3.Client
	bucket    string
	publicURL string
}

// NewR2Client R2クライアントを初期化
func NewR2Client() (*R2Client, error) {
	// 本番環境でのデバッグ情報を出力
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("=== R2 Client Initialization Debug ===")
	}

	accountID := os.Getenv("CLOUDFLARE_R2_ACCOUNT_ID")
	accessKeyID := os.Getenv("CLOUDFLARE_R2_ACCESS_KEY_ID")
	secretAccessKey := os.Getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY")
	endpoint := os.Getenv("CLOUDFLARE_R2_ENDPOINT")
	bucket := os.Getenv("CLOUDFLARE_R2_BUCKET_NAME")
	publicURL := os.Getenv("CLOUDFLARE_R2_PUBLIC_URL")

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Account ID exists: %v", accountID != "")
		r2Log.Printf("Access Key ID exists: %v", accessKeyID != "")
		r2Log.Printf("Secret Access Key exists: %v", secretAccessKey != "")
		r2Log.Printf("Endpoint: %s", endpoint)
		r2Log.Printf("Bucket: %s", bucket)
		r2Log.Printf("Public URL: %s", publicURL)
	}

	if accountID == "" || accessKeyID == "" || secretAccessKey == "" || endpoint == "" || bucket == "" {
		r2Log.Printf("ERROR: R2 environment variables not properly configured")
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("Account ID empty: %v", accountID == "")
			r2Log.Printf("Access Key ID empty: %v", accessKeyID == "")
			r2Log.Printf("Secret Access Key empty: %v", secretAccessKey == "")
			r2Log.Printf("Endpoint empty: %v", endpoint == "")
			r2Log.Printf("Bucket empty: %v", bucket == "")
		}
		return nil, fmt.Errorf("R2 environment variables not properly configured")
	}

	// カスタム設定でAWS SDKを設定
	customResolver := aws.EndpointResolverWithOptionsFunc(func(service, region string, options ...interface{}) (aws.Endpoint, error) {
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("Resolving endpoint for service: %s, region: %s", service, region)
		}
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
		r2Log.Printf("ERROR: Failed to load AWS config: %v", err)
		return nil, fmt.Errorf("failed to load AWS config: %v", err)
	}

	client := s3.NewFromConfig(cfg)

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("R2 client initialized successfully")
	}

	return &R2Client{
		client:    client,
		bucket:    bucket,
		publicURL: publicURL,
	}, nil
}

// SaveImageToR2 画像をR2に保存
func SaveImageToR2(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("=== SaveImageToR2 Production Debug ===")
		r2Log.Printf("Path: %s", path)
		r2Log.Printf("FileName: %s", fileName)
		r2Log.Printf("Original Filename: %s", file.Filename)
		r2Log.Printf("File Size: %d", file.Size)
		r2Log.Printf("Content Type: %s", file.Header.Get("Content-Type"))
	} else {
		r2Log.Printf("Starting SaveImageToR2 function with path: %s, fileName: %s", path, fileName)
	}

	// R2クライアントを初期化
	r2Client, err := NewR2Client()
	if err != nil {
		r2Log.Printf("ERROR: Failed to initialize R2 client: %v", err)
		return "", fmt.Errorf("failed to initialize R2 client: %v", err)
	}

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		r2Log.Printf("ERROR: Failed to open file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// ファイルの内容を読み込む
	fileContent, err := io.ReadAll(src)
	if err != nil {
		r2Log.Printf("ERROR: Failed to read file content: %v", err)
		return "", fmt.Errorf("failed to read file content: %v", err)
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("File content read successfully, size: %d bytes", len(fileContent))
	}

	// ファイル名を生成
	if fileName == "" {
		ext := filepath.Ext(file.Filename)
		fileName = fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("Generated filename: %s", fileName)
		}
	}

	// ファイルパスを生成
	filePath := filepath.Join(path, fileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/")

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Final file path: %s", filePath)
	}

	// コンテンツタイプを取得
	contentType := file.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Content type: %s", contentType)
		r2Log.Printf("Uploading to R2 bucket: %s", r2Client.bucket)
	}

	// R2にアップロード
	_, err = r2Client.client.PutObject(context.TODO(), &s3.PutObjectInput{
		Bucket:      aws.String(r2Client.bucket),
		Key:         aws.String(filePath),
		Body:        bytes.NewReader(fileContent),
		ContentType: aws.String(contentType),
	})
	if err != nil {
		r2Log.Printf("ERROR: Failed to upload to R2: %v", err)
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("Bucket: %s", r2Client.bucket)
			r2Log.Printf("Key: %s", filePath)
			r2Log.Printf("Content Type: %s", contentType)
		}
		return "", fmt.Errorf("failed to upload to R2: %v", err)
	}

	r2Log.Printf("Successfully uploaded file to R2: %s", filePath)

	// 本番環境では公開URLも生成してログ出力
	if os.Getenv("ENVIRONMENT") == "production" {
		publicURL := GetR2PublicURL(filePath)
		r2Log.Printf("Generated public URL: %s", publicURL)
	}

	return filePath, nil
}

// DeleteImageFromR2 R2から画像を削除
func DeleteImageFromR2(filePath string) error {
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("=== DeleteImageFromR2 Production Debug ===")
		r2Log.Printf("File path: %s", filePath)
	} else {
		r2Log.Printf("Starting DeleteImageFromR2 function with filePath: %s", filePath)
	}

	// R2クライアントを初期化
	r2Client, err := NewR2Client()
	if err != nil {
		r2Log.Printf("ERROR: Failed to initialize R2 client: %v", err)
		return fmt.Errorf("failed to initialize R2 client: %v", err)
	}

	// R2から削除
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Deleting from R2 bucket: %s", r2Client.bucket)
	}

	_, err = r2Client.client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(r2Client.bucket),
		Key:    aws.String(filePath),
	})
	if err != nil {
		r2Log.Printf("ERROR: Failed to delete from R2: %v", err)
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("Bucket: %s", r2Client.bucket)
			r2Log.Printf("Key: %s", filePath)
		}
		return fmt.Errorf("failed to delete from R2: %v", err)
	}

	r2Log.Printf("Successfully deleted file from R2: %s", filePath)
	return nil
}

// GetR2PublicURL R2の公開URLを生成
func GetR2PublicURL(filePath string) string {
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("=== GetR2PublicURL Production Debug ===")
		r2Log.Printf("File path: %s", filePath)
	}

	publicURL := os.Getenv("CLOUDFLARE_R2_PUBLIC_URL")

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Public URL from env: %s", publicURL)
	}

	if publicURL == "" {
		if os.Getenv("ENVIRONMENT") == "production" {
			r2Log.Printf("WARNING: CLOUDFLARE_R2_PUBLIC_URL is not set")
		}
		return ""
	}

	fullURL := fmt.Sprintf("%s/%s", publicURL, filePath)

	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Generated full URL: %s", fullURL)
	}

	return fullURL
}

// extractFilePathFromURL URLからファイルパスを抽出
func extractFilePathFromURL(url string) string {
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("=== extractFilePathFromURL Production Debug ===")
		r2Log.Printf("Input URL: %s", url)
	}

	// SupabaseのURLからパスを抽出
	if strings.Contains(url, "/storage/v1/object/public/images/") {
		parts := strings.Split(url, "/storage/v1/object/public/images/")
		if len(parts) == 2 {
			if os.Getenv("ENVIRONMENT") == "production" {
				r2Log.Printf("Extracted from Supabase URL: %s", parts[1])
			}
			return parts[1]
		}
	}

	// R2のURLからパスを抽出
	if strings.Contains(url, ".r2.dev/") {
		parts := strings.Split(url, ".r2.dev/")
		if len(parts) == 2 {
			if os.Getenv("ENVIRONMENT") == "production" {
				r2Log.Printf("Extracted from R2 URL: %s", parts[1])
			}
			return parts[1]
		}
	}

	// カスタムドメインのURLからパスを抽出
	if strings.Contains(url, "/") {
		parts := strings.Split(url, "/")
		if len(parts) > 1 {
			extracted := strings.Join(parts[1:], "/")
			if os.Getenv("ENVIRONMENT") == "production" {
				r2Log.Printf("Extracted from custom domain URL: %s", extracted)
			}
			return extracted
		}
	}

	// パスがそのまま渡された場合
	if os.Getenv("ENVIRONMENT") == "production" {
		r2Log.Printf("Using URL as-is: %s", url)
	}
	return url
}
