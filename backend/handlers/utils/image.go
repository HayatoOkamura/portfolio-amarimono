package utils

import (
	"bytes"
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"
	storage_go "github.com/supabase-community/storage-go"
	"github.com/supabase-community/supabase-go"
)

var log = logrus.New()

// SaveImage は画像を保存し、URLを返す
func SaveImage(c *gin.Context, file *multipart.FileHeader, path string, fileName string) (string, error) {
	log.Printf("Starting SaveImage function with path: %s, fileName: %s", path, fileName)

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		log.Printf("Error opening file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// ファイルの内容を読み込む
	buf := make([]byte, file.Size)
	if _, err := src.Read(buf); err != nil {
		log.Printf("Error reading file: %v", err)
		return "", fmt.Errorf("failed to read file: %v", err)
	}
	log.Printf("Successfully read file of size: %d bytes", file.Size)

	// ファイル名を生成
	if fileName == "" {
		ext := filepath.Ext(file.Filename)
		fileName = fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
	}
	log.Printf("Generated filename: %s", fileName)

	// ファイルパスを生成
	filePath := filepath.Join(path, fileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/") // Windowsのパス区切り文字を修正
	log.Printf("Generated filepath: %s", filePath)

	// Supabaseクライアントの初期化
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		return "", fmt.Errorf("supabase environment variables are not properly set")
	}

	// SupabaseのURLがlocalhostの場合、host.docker.internalに置き換え
	if strings.Contains(supabaseURL, "localhost") {
		supabaseURL = strings.Replace(supabaseURL, "localhost", "host.docker.internal", 1)
	}

	log.Printf("Supabase URL: %s", supabaseURL)
	log.Printf("Storage URL: %s", supabaseURL)

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return "", fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	log.Printf("Successfully initialized Supabase client")

	// Supabase Storageにアップロード
	contentType := file.Header.Get("Content-Type")
	log.Printf("File content type: %s", contentType)

	fileOptions := storage_go.FileOptions{
		ContentType: &contentType,
	}

	log.Printf("Attempting to upload file to Supabase Storage...")
	_, err = supabaseClient.Storage.UploadFile("images", filePath, bytes.NewReader(buf), fileOptions)
	if err != nil {
		log.Printf("Error uploading to Supabase Storage: %v", err)
		return "", fmt.Errorf("failed to upload to Supabase Storage: %v", err)
	}
	log.Printf("Successfully uploaded file to Supabase Storage")

	// 相対パスのみを返す
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

// DeleteImage は画像を削除する
func DeleteImage(imageURL string) error {
	log.Printf("Starting DeleteImage function for URL: %s", imageURL)

	// SupabaseのURLからパスを抽出
	re := regexp.MustCompile(`/storage/v1/object/public/images/(.+)`)
	matches := re.FindStringSubmatch(imageURL)
	if len(matches) < 2 {
		log.Printf("Invalid image URL format: %s", imageURL)
		return fmt.Errorf("invalid image URL format")
	}
	filePath := matches[1]
	log.Printf("Extracted file path: %s", filePath)

	// Supabaseクライアントを初期化
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		log.Printf("Missing Supabase environment variables. URL: %s, Key exists: %v", supabaseURL, supabaseKey != "")
		return fmt.Errorf("supabase environment variables are not set")
	}

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Printf("Error initializing Supabase client: %v", err)
		return fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	log.Printf("Successfully initialized Supabase client")

	// Supabase Storageから削除
	log.Printf("Attempting to delete file from Supabase Storage...")
	_, err = supabaseClient.Storage.RemoveFile("images", []string{filePath})
	if err != nil {
		log.Printf("Error deleting from Supabase Storage: %v", err)
		return fmt.Errorf("failed to delete from Supabase Storage: %v", err)
	}
	log.Printf("Successfully deleted file from Supabase Storage")

	return nil
}
