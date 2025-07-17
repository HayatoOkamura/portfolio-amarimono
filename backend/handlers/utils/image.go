package utils

import (
	"bytes"
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
	storage_go "github.com/supabase-community/storage-go"
	supabase "github.com/supabase-community/supabase-go"
)

var log = logrus.New()

// SaveImage は画像を保存し、URLを返す（R2対応）
func SaveImage(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
	// 本番環境でのデバッグ情報を出力
	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("=== SaveImage Production Debug ===")
		log.Printf("Path: %s", path)
		log.Printf("FileName: %s", fileName)
		log.Printf("Original Filename: %s", file.Filename)
		log.Printf("File Size: %d", file.Size)
		log.Printf("Content Type: %s", file.Header.Get("Content-Type"))
	}

	// 環境変数でストレージを切り替え
	storageType := os.Getenv("STORAGE_TYPE")

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Storage Type: %s", storageType)
		log.Printf("Environment: %s", os.Getenv("ENVIRONMENT"))
		// 環境変数の確認
		log.Printf("CLOUDFLARE_R2_ACCOUNT_ID exists: %v", os.Getenv("CLOUDFLARE_R2_ACCOUNT_ID") != "")
		log.Printf("CLOUDFLARE_R2_ACCESS_KEY_ID exists: %v", os.Getenv("CLOUDFLARE_R2_ACCESS_KEY_ID") != "")
		log.Printf("CLOUDFLARE_R2_SECRET_ACCESS_KEY exists: %v", os.Getenv("CLOUDFLARE_R2_SECRET_ACCESS_KEY") != "")
		log.Printf("CLOUDFLARE_R2_ENDPOINT: %s", os.Getenv("CLOUDFLARE_R2_ENDPOINT"))
		log.Printf("CLOUDFLARE_R2_BUCKET_NAME: %s", os.Getenv("CLOUDFLARE_R2_BUCKET_NAME"))
		log.Printf("CLOUDFLARE_R2_PUBLIC_URL: %s", os.Getenv("CLOUDFLARE_R2_PUBLIC_URL"))
	}

	if storageType == "r2" {
		if os.Getenv("ENVIRONMENT") == "production" {
			log.Printf("Using R2 storage")
		}
		return SaveImageToR2(c, file, path, fileName)
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Using Supabase storage (fallback)")
	}
	// 既存のSupabase実装（フォールバック）
	return SaveImageToSupabase(c, file, path, fileName)
}

// SaveImageToSupabase は画像をSupabaseに保存し、URLを返す
func SaveImageToSupabase(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("=== SaveImageToSupabase Production Debug ===")
		log.Printf("Path: %s", path)
		log.Printf("FileName: %s", fileName)
		log.Printf("Original Filename: %s", file.Filename)
		log.Printf("File Size: %d", file.Size)
	} else {
		log.Printf("Starting SaveImageToSupabase function with path: %s, fileName: %s", path, fileName)
	}

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		log.Printf("ERROR: Failed to open file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()
	log.Printf("Successfully opened file: %s", file.Filename)

	// ファイルの内容を読み込む
	fileContent, err := io.ReadAll(src)
	if err != nil {
		log.Printf("ERROR: Failed to read file content: %v", err)
		return "", fmt.Errorf("failed to read file content: %v", err)
	}
	log.Printf("Successfully read file content, size: %d bytes", len(fileContent))

	// ファイル名を生成
	if fileName == "" {
		ext := filepath.Ext(file.Filename)
		fileName = fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
		log.Printf("Generated new fileName: %s", fileName)
	}

	// ファイルパスを生成
	filePath := filepath.Join(path, fileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/") // Windowsのパス区切り文字を修正
	log.Printf("Generated filePath: %s", filePath)

	// Get Supabase credentials
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	log.Printf("Supabase URL: %s", supabaseURL)
	log.Printf("Supabase Key exists: %v", supabaseKey != "")

	// For local development, update the URL
	if os.Getenv("ENVIRONMENT") == "development" {
		supabaseURL = "http://host.docker.internal:54321"
		log.Printf("Updated Supabase URL for Docker: %s", supabaseURL)
	}

	// Initialize Supabase client
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Printf("ERROR: Failed to initialize Supabase client: %v", err)
		return "", fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	log.Printf("Successfully initialized Supabase client")

	// Get file content type
	contentType := file.Header.Get("Content-Type")
	log.Printf("File content type: %s", contentType)

	// Try to delete existing file first
	_, err = client.Storage.RemoveFile("images", []string{filePath})
	if err != nil {
		log.Printf("Warning: Failed to delete existing file: %v", err)
		// Continue with upload even if deletion fails
	}

	// Create file options
	upsert := true
	fileOptions := storage_go.FileOptions{
		ContentType: &contentType,
		Upsert:      &upsert,
	}

	// Upload the file to Supabase Storage
	_, err = client.Storage.UploadFile("images", filePath, bytes.NewReader(fileContent), fileOptions)
	if err != nil {
		log.Printf("ERROR: Failed to upload to Supabase Storage: %v", err)
		return "", fmt.Errorf("failed to upload to Supabase Storage: %v", err)
	}

	log.Printf("Successfully uploaded file to Supabase Storage")
	return filePath, nil
}

// SaveRecipeImage はレシピの画像を保存する
func SaveRecipeImage(c *gin.Context, file *multipart.FileHeader, recipeID string, isInstruction bool) (string, error) {
	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("=== SaveRecipeImage Production Debug ===")
		log.Printf("Recipe ID: %s", recipeID)
		log.Printf("Is Instruction: %v", isInstruction)
		log.Printf("Original Filename: %s", file.Filename)
	}

	// パスを設定
	basePath := "recipes"
	if isInstruction {
		basePath = filepath.Join(basePath, recipeID, "instructions")
	} else {
		basePath = filepath.Join(basePath, recipeID)
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Base Path: %s", basePath)
	}

	// ファイル名を生成（拡張子を保持）
	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Generated filename: %s", fileName)
	}

	// 画像を保存
	imagePath, err := SaveImage(c, file, basePath, fileName)
	if err != nil {
		if os.Getenv("ENVIRONMENT") == "production" {
			log.Printf("ERROR: Failed to save recipe image: %v", err)
		}
		return "", err
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Successfully saved recipe image: %s", imagePath)
	}
	// 相対パスのみを返す
	return imagePath, nil
}

// DeleteImage は画像を削除する（R2対応）
func DeleteImage(url string) error {
	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("=== DeleteImage Production Debug ===")
		log.Printf("URL to delete: %s", url)
	}

	storageType := os.Getenv("STORAGE_TYPE")

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Storage Type: %s", storageType)
	}

	if storageType == "r2" {
		if os.Getenv("ENVIRONMENT") == "production" {
			log.Printf("Using R2 delete")
		}
		// URLからファイルパスを抽出
		filePath := extractFilePathFromURL(url)
		return DeleteImageFromR2(filePath)
	}

	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("Using Supabase delete (fallback)")
	}
	// 既存のSupabase実装（フォールバック）
	return DeleteImageFromSupabase(url)
}

// DeleteImageFromSupabase は画像をSupabaseから削除する
func DeleteImageFromSupabase(url string) error {
	if os.Getenv("ENVIRONMENT") == "production" {
		log.Printf("=== DeleteImageFromSupabase Production Debug ===")
		log.Printf("URL: %s", url)
	} else {
		log.Printf("Starting DeleteImageFromSupabase function with URL: %s", url)
	}

	// Extract file path from URL
	var filePath string
	if strings.HasPrefix(url, "http") {
		// If it's a full URL, extract the path after /object/public/
		parts := strings.Split(url, "/object/public/")
		if len(parts) != 2 {
			log.Printf("ERROR: Invalid image URL format: %s", url)
			return fmt.Errorf("invalid image URL format")
		}
		filePath = parts[1]
	} else {
		// If it's just a path, use it directly
		filePath = url
	}

	log.Printf("Extracted file path: %s", filePath)

	// Get Supabase credentials
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	log.Printf("Supabase URL: %s", supabaseURL)
	log.Printf("Supabase Key exists: %v", supabaseKey != "")

	// For local development, update the URL
	if os.Getenv("ENVIRONMENT") == "development" {
		supabaseURL = "http://host.docker.internal:54321"
		log.Printf("Updated Supabase URL for Docker: %s", supabaseURL)
	}

	// Initialize Supabase client
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Printf("ERROR: Failed to initialize Supabase client: %v", err)
		return fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	log.Printf("Successfully initialized Supabase client")

	// Delete the file from Supabase Storage
	_, err = client.Storage.RemoveFile("images", []string{filePath})
	if err != nil {
		log.Printf("ERROR: Failed to delete file from Supabase Storage: %v", err)
		return fmt.Errorf("failed to delete from Supabase Storage: %v", err)
	}

	log.Printf("Successfully deleted file from Supabase Storage")
	return nil
}
