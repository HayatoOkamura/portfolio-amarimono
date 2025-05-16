package utils

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

var log = logrus.New()

// SaveImage は環境に応じて画像を保存し、URLを返す
func SaveImage(c *gin.Context, file *multipart.FileHeader, dir string, recipeID string) (string, error) {
	// 環境変数で保存先を判定
	env := os.Getenv("GO_ENV")
	if env == "production" {
		return saveToSupabase(file, dir, recipeID)
	}
	return saveToLocal(c, file, dir, recipeID)
}

// saveToLocal はローカルストレージに画像を保存
func saveToLocal(c *gin.Context, file *multipart.FileHeader, dir string, id string) (string, error) {
	// dirが空の場合はエラーを返す
	if dir == "" {
		log.Printf("ERROR: 保存先ディレクトリが指定されていません")
		return "", fmt.Errorf("保存先ディレクトリが指定されていません")
	}

	// 保存先のディレクトリを構築
	var saveDir string
	if dir == "ingredients" {
		// 具材の画像の場合
		if id == "" {
			log.Printf("ERROR: 具材IDが指定されていません")
			return "", fmt.Errorf("具材IDが指定されていません")
		}
		saveDir = filepath.Join(".", "uploads", "ingredients", id)
	} else if dir == "temp_uploads" {
		// 一時的なアップロードの場合
		saveDir = filepath.Join(".", "uploads", "temp")
	} else if strings.HasPrefix(dir, "users/") {
		// ユーザープロフィール画像の場合
		saveDir = filepath.Join(".", "uploads", dir)
	} else {
		// レシピの画像の場合
		if id == "" {
			log.Printf("ERROR: レシピIDが指定されていません")
			return "", fmt.Errorf("レシピIDが指定されていません")
		}
		saveDir = filepath.Join(".", "uploads", "recipes", id, dir)
	}

	log.Printf("INFO: 画像を保存するディレクトリ: %s", saveDir)

	// ディレクトリが存在しない場合は作成
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		log.Printf("INFO: ディレクトリが存在しないため作成します: %s", saveDir)
		if err := os.MkdirAll(saveDir, 0755); err != nil {
			log.Printf("ERROR: ディレクトリの作成に失敗しました: %v", err)
			return "", err
		}
	}

	// 一意のファイル名を生成
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)
	log.Printf("INFO: 画像の保存パス: %s", savePath)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		log.Printf("ERROR: 画像の保存に失敗しました: %v", err)
		return "", err
	}

	// 相対パスを返す
	if dir == "ingredients" {
		return filepath.Join("ingredients", id, uniqueFilename), nil
	} else if dir == "temp_uploads" {
		return filepath.Join("temp", uniqueFilename), nil
	} else if strings.HasPrefix(dir, "users/") {
		return filepath.Join(dir, uniqueFilename), nil
	} else {
		return filepath.Join("recipes", id, dir, uniqueFilename), nil
	}
}

// saveToSupabase はSupabase Storageに画像を保存
func saveToSupabase(file *multipart.FileHeader, dir string, id string) (string, error) {
	// 環境変数のチェック
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")
	if supabaseKey == "" {
		log.Printf("ERROR: SUPABASE_SERVICE_KEY is not set")
		return "", fmt.Errorf("SUPABASE_SERVICE_KEY is not set")
	}

	// ファイルを開く
	src, err := file.Open()
	if err != nil {
		log.Printf("ERROR: Failed to open file: %v", err)
		return "", fmt.Errorf("failed to open file: %v", err)
	}
	defer src.Close()

	// ファイルの内容を読み込む
	buf := new(bytes.Buffer)
	if _, err := io.Copy(buf, src); err != nil {
		log.Printf("ERROR: Failed to read file content: %v", err)
		return "", fmt.Errorf("failed to read file content: %v", err)
	}

	// ファイルの拡張子を取得
	ext := filepath.Ext(file.Filename)
	if ext == "" {
		ext = ".png" // デフォルトの拡張子
	}

	// 一意のファイル名を生成
	uniqueFilename := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)

	// パス名を構築（URLエンコードは各コンポーネントに対してのみ行う）
	var filePath string
	if dir == "ingredients" {
		// 具材の画像の場合
		if id == "" {
			log.Printf("ERROR: 具材IDが指定されていません")
			return "", fmt.Errorf("具材IDが指定されていません")
		}
		encodedID := url.PathEscape(id)
		encodedFilename := url.PathEscape(uniqueFilename)
		filePath = fmt.Sprintf("ingredients/%s/%s", encodedID, encodedFilename)
	} else if dir == "temp_uploads" {
		// 一時的なアップロードの場合
		encodedFilename := url.PathEscape(uniqueFilename)
		filePath = fmt.Sprintf("temp/%s", encodedFilename)
	} else if strings.HasPrefix(dir, "users/") {
		// ユーザープロフィール画像の場合
		encodedFilename := url.PathEscape(uniqueFilename)
		filePath = fmt.Sprintf("%s/%s", dir, encodedFilename)
	} else {
		// レシピの画像の場合
		if id == "" {
			log.Printf("ERROR: レシピIDが指定されていません")
			return "", fmt.Errorf("レシピIDが指定されていません")
		}
		encodedID := url.PathEscape(id)
		encodedDir := url.PathEscape(dir)
		encodedFilename := url.PathEscape(uniqueFilename)
		filePath = fmt.Sprintf("recipes/%s/%s/%s", encodedID, encodedDir, encodedFilename)
	}

	// Supabase Storageにアップロード
	supabaseURL := "https://qmrjsqeigdkizkrpiahs.supabase.co/storage/v1/object/images/" + filePath
	log.Printf("INFO: Uploading to Supabase URL: %s", supabaseURL)

	req, err := http.NewRequest("PUT", supabaseURL, bytes.NewReader(buf.Bytes()))
	if err != nil {
		log.Printf("ERROR: Failed to create request: %v", err)
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	// ヘッダーを設定
	req.Header.Set("Content-Type", file.Header.Get("Content-Type"))
	req.Header.Set("Authorization", "Bearer "+supabaseKey)

	// リクエストを送信
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("ERROR: Failed to send request: %v", err)
		return "", fmt.Errorf("failed to send request: %v", err)
	}
	defer resp.Body.Close()

	// レスポンスの内容を読み込む
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("ERROR: Failed to read response body: %v", err)
	} else {
		log.Printf("INFO: Response body: %s", string(body))
	}

	if resp.StatusCode != http.StatusOK {
		log.Printf("ERROR: Upload failed with status: %d, body: %s", resp.StatusCode, string(body))
		return "", fmt.Errorf("failed to upload image: status %d, body: %s", resp.StatusCode, string(body))
	}

	return filePath, nil
}

// DeleteImage は環境に応じて画像を削除する
func DeleteImage(imagePath string) error {
	env := os.Getenv("GO_ENV")
	if env == "production" {
		return deleteFromSupabase(imagePath)
	}
	return deleteFromLocal(imagePath)
}

// deleteFromLocal はローカルストレージから画像を削除
func deleteFromLocal(imagePath string) error {
	// 先頭の/を除去
	if strings.HasPrefix(imagePath, "/") {
		imagePath = imagePath[1:]
	}
	// /uploads/を除去
	if strings.HasPrefix(imagePath, "uploads/") {
		imagePath = imagePath[8:]
	}

	// パスの最初の部分で保存先を判定
	parts := strings.Split(imagePath, "/")
	if len(parts) < 2 {
		return fmt.Errorf("invalid image path: %s", imagePath)
	}

	var fullPath string
	switch parts[0] {
	case "ingredients":
		// 具材の画像の場合
		fullPath = filepath.Join(".", "uploads", imagePath)
	case "recipes":
		// レシピの画像の場合
		fullPath = filepath.Join(".", "uploads", imagePath)
	case "temp":
		// 一時的な画像の場合
		fullPath = filepath.Join(".", "uploads", imagePath)
	case "users":
		// ユーザープロフィール画像の場合
		fullPath = filepath.Join(".", "uploads", imagePath)
	default:
		return fmt.Errorf("invalid image type: %s", parts[0])
	}

	return os.Remove(fullPath)
}

// deleteFromSupabase はSupabase Storageから画像を削除
func deleteFromSupabase(imagePath string) error {
	supabaseURL := "https://qmrjsqeigdkizkrpiahs.supabase.co/storage/v1/object/public/images/" + imagePath
	req, err := http.NewRequest("DELETE", supabaseURL, nil)
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", "Bearer "+os.Getenv("SUPABASE_SERVICE_KEY"))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("failed to delete image: %s", resp.Status)
	}

	return nil
}
