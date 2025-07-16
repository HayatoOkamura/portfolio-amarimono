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
	r2Log.Printf("Starting SaveImageToR2 function with path: %s, fileName: %s", path, fileName)

	// R2クライアントを初期化
	r2Client, err := NewR2Client()
	if err != nil {
		r2Log.Printf("Failed to initialize R2 client: %v", err)
		return "", fmt.Errorf("failed to initialize R2 client: %v", err)
	}

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		r2Log.Printf("Failed to open file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// ファイルの内容を読み込む
	fileContent, err := io.ReadAll(src)
	if err != nil {
		r2Log.Printf("Failed to read file content: %v", err)
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
		r2Log.Printf("Failed to upload to R2: %v", err)
		return "", fmt.Errorf("failed to upload to R2: %v", err)
	}

	r2Log.Printf("Successfully uploaded file to R2: %s", filePath)
	return filePath, nil
}

// DeleteImageFromR2 R2から画像を削除
func DeleteImageFromR2(filePath string) error {
	r2Log.Printf("Starting DeleteImageFromR2 function with filePath: %s", filePath)

	// R2クライアントを初期化
	r2Client, err := NewR2Client()
	if err != nil {
		r2Log.Printf("Failed to initialize R2 client: %v", err)
		return fmt.Errorf("failed to initialize R2 client: %v", err)
	}

	// R2から削除
	_, err = r2Client.client.DeleteObject(context.TODO(), &s3.DeleteObjectInput{
		Bucket: aws.String(r2Client.bucket),
		Key:    aws.String(filePath),
	})
	if err != nil {
		r2Log.Printf("Failed to delete from R2: %v", err)
		return fmt.Errorf("failed to delete from R2: %v", err)
	}

	r2Log.Printf("Successfully deleted file from R2: %s", filePath)
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

// extractFilePathFromURL URLからファイルパスを抽出
func extractFilePathFromURL(url string) string {
	// SupabaseのURLからパスを抽出
	if strings.Contains(url, "/storage/v1/object/public/images/") {
		parts := strings.Split(url, "/storage/v1/object/public/images/")
		if len(parts) == 2 {
			return parts[1]
		}
	}

	// R2のURLからパスを抽出
	if strings.Contains(url, ".r2.dev/") {
		parts := strings.Split(url, ".r2.dev/")
		if len(parts) == 2 {
			return parts[1]
		}
	}

	// カスタムドメインのURLからパスを抽出
	if strings.Contains(url, "/") {
		parts := strings.Split(url, "/")
		if len(parts) > 1 {
			return strings.Join(parts[1:], "/")
		}
	}

	// パスがそのまま渡された場合
	return url
}
