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

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// ファイルの内容を読み込む
	buf := make([]byte, file.Size)
	if _, err := src.Read(buf); err != nil {
		return "", fmt.Errorf("failed to read file: %v", err)
	}

	// ファイル名を生成
	if fileName == "" {
		ext := filepath.Ext(file.Filename)
		fileName = fmt.Sprintf("%d_%s%s", time.Now().Unix(), uuid.New().String(), ext)
	}

	// ファイルパスを生成
	filePath := filepath.Join(path, fileName)
	filePath = strings.ReplaceAll(filePath, "\\", "/") // Windowsのパス区切り文字を修正

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

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return "", fmt.Errorf("failed to initialize Supabase client: %v", err)
	}

	// Supabase Storageにアップロード
	contentType := file.Header.Get("Content-Type")

	fileOptions := storage_go.FileOptions{
		ContentType: &contentType,
	}

	_, err = supabaseClient.Storage.UploadFile("images", filePath, bytes.NewReader(buf), fileOptions)
	if err != nil {
		return "", fmt.Errorf("failed to upload to Supabase Storage: %v", err)
	}

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

	// SupabaseのURLからパスを抽出
	re := regexp.MustCompile(`/storage/v1/object/public/images/(.+)`)
	matches := re.FindStringSubmatch(imageURL)
	if len(matches) < 2 {	
		return fmt.Errorf("invalid image URL format")
	}
	filePath := matches[1]

	// Supabaseクライアントを初期化
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		return fmt.Errorf("supabase environment variables are not set")
	}

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return fmt.Errorf("failed to initialize Supabase client: %v", err)
	}

	// Supabase Storageから削除
	_, err = supabaseClient.Storage.RemoveFile("images", []string{filePath})
	if err != nil {
		return fmt.Errorf("failed to delete from Supabase Storage: %v", err)
	}

	return nil
}
