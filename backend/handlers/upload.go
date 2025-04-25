package handlers

import (
	"net/http"

	"portfolio-amarimono/handlers/utils"

	"github.com/gin-gonic/gin"
)

type UploadHandler struct{}

func NewUploadHandler() *UploadHandler {
	return &UploadHandler{}
}

// UploadImage は画像をアップロードするエンドポイント
func (h *UploadHandler) UploadImage(c *gin.Context) {
	// 画像ファイルを取得
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	// 保存先のパスを取得
	path := c.PostForm("path")
	if path == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No path provided"})
		return
	}

	// 画像を保存
	imageURL, err := utils.SaveImage(c, file, path, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"imageUrl": imageURL})
}
