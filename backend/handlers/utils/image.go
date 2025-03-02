package utils

import (
	"fmt"
	"mime/multipart"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

// SaveImage は画像を指定ディレクトリに保存し、アクセス可能なURLを返す
func SaveImage(c *gin.Context, file *multipart.FileHeader, dir string) (string, error) {
	saveDir := filepath.Join(".", "uploads", dir)
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			return "", err
		}
	}

	// 一意のファイル名を生成（タイムスタンプ + 元のファイル名）
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", err
	}

	// 画像のアクセスURLを返す（静的ファイルのURLパスに変更）
	return fmt.Sprintf("http://localhost:8080/uploads/%s/%s", dir, uniqueFilename), nil
}
