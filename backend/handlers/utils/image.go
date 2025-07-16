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
	// 環境変数でストレージを切り替え
	storageType := os.Getenv("STORAGE_TYPE")
	if storageType == "r2" {
		return SaveImageToR2(c, file, path, fileName)
	}

	// 既存のSupabase実装（フォールバック）
	return SaveImageToSupabase(c, file, path, fileName)
}

// SaveImageToSupabase は画像をSupabaseに保存し、URLを返す
func SaveImageToSupabase(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
	log.Printf("Starting SaveImageToSupabase function with path: %s, fileName: %s", path, fileName)

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		log.Printf("Failed to open file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()
	log.Printf("Successfully opened file: %s", file.Filename)

	// ファイルの内容を読み込む
	fileContent, err := io.ReadAll(src)
	if err != nil {
		log.Printf("Failed to read file content: %v", err)
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
		log.Printf("Failed to initialize Supabase client: %v", err)
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
		log.Printf("Failed to upload to Supabase Storage: %v", err)
		return "", fmt.Errorf("failed to upload to Supabase Storage: %v", err)
	}

	log.Printf("Successfully uploaded file to Supabase Storage")
	return filePath, nil
}

// SaveRecipeImage はレシピの画像を保存する
func SaveRecipeImage(c *gin.Context, file *multipart.FileHeader, recipeID string, isInstruction bool) (string, error) {
	// パスを設定
	basePath := "recipes"
	if isInstruction {
		basePath = filepath.Join(basePath, recipeID, "instructions")
	} else {
		basePath = filepath.Join(basePath, recipeID)
	}

	// ファイル名を生成（拡張子を保持）
	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%s%s", uuid.New().String(), ext)

	// 画像を保存
	imagePath, err := SaveImage(c, file, basePath, fileName)
	if err != nil {
		return "", err
	}

	// 相対パスのみを返す
	return imagePath, nil
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

// DeleteImageFromSupabase は画像をSupabaseから削除する
func DeleteImageFromSupabase(url string) error {
	logrus.Printf("Starting DeleteImageFromSupabase function with URL: %s", url)

	// Extract file path from URL
	var filePath string
	if strings.HasPrefix(url, "http") {
		// If it's a full URL, extract the path after /object/public/
		parts := strings.Split(url, "/object/public/")
		if len(parts) != 2 {
			logrus.Printf("Invalid image URL format: %s", url)
			return fmt.Errorf("invalid image URL format")
		}
		filePath = parts[1]
	} else {
		// If it's just a path, use it directly
		filePath = url
	}

	logrus.Printf("Extracted file path: %s", filePath)

	// Get Supabase credentials
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	logrus.Printf("Supabase URL: %s", supabaseURL)
	logrus.Printf("Supabase Key exists: %v", supabaseKey != "")

	// For local development, update the URL
	if os.Getenv("ENVIRONMENT") == "development" {
		supabaseURL = "http://host.docker.internal:54321"
		logrus.Printf("Updated Supabase URL for Docker: %s", supabaseURL)
	}

	// Initialize Supabase client
	client, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		logrus.Printf("Failed to initialize Supabase client: %v", err)
		return fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	logrus.Printf("Successfully initialized Supabase client")

	// Delete the file from Supabase Storage
	_, err = client.Storage.RemoveFile("images", []string{filePath})
	if err != nil {
		logrus.Printf("Failed to delete file from Supabase Storage: %v", err)
		return fmt.Errorf("failed to delete from Supabase Storage: %v", err)
	}

	logrus.Printf("Successfully deleted file from Supabase Storage")
	return nil
}
