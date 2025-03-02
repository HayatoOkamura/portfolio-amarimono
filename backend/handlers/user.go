package handlers

import (
	"log"
	"net/http"

	"portfolio-amarimono/handlers/utils"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type UserHandler struct {
	DB *gorm.DB
}

// NewUserHandler は UserHandler を初期化するコンストラクタ
func NewUserHandler(db *gorm.DB) *UserHandler {
	return &UserHandler{
		DB: db,
	}
}

// CreateUser ユーザー作成のハンドラー
func (h *UserHandler) CreateUser(c *gin.Context) {
	// Multipart form dataを取得
	form, err := c.MultipartForm()
	if err != nil {
		log.Println("Form parsing error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	// フォームデータのログ
	for key, values := range form.Value {
		log.Printf("%s: %v", key, values)
	}

	// 必要なデータをUser構造体にマッピング
	user := models.User{
		ID:       form.Value["id"][0],       // ID
		Email:    form.Value["email"][0],    // Email
		Username: form.Value["username"][0], // ユーザー名
		Age:      form.Value["age"][0],      // 年齢
		Gender:   form.Value["gender"][0],   // 性別
	}

	// 画像ファイルがある場合は処理
	if files := form.File["profileImage"]; len(files) > 0 {
		// ここで画像の保存処理（例: ファイルをローカルディスクに保存するなど）
		profileImage := files[0]

		// 保存先ディレクトリに保存
		imageURL, err := utils.SaveImage(c, profileImage, "user")
		if err != nil {
			log.Printf("File upload error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile image"})
			return
		}

		// 保存した画像のパスをUser構造体に追加
		user.ProfileImage = imageURL
	}

	// ユーザーをデータベースに保存
	if err := models.CreateUser(h.DB, user); err != nil {
		log.Printf("Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User created successfully"})
}

// GetUserProfile ユーザーのプロフィール情報を取得するハンドラー
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID := c.Param("id") // URLのパラメータからuserIDを取得

	user, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("Failed to retrieve user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":           user.ID,
		"email":        user.Email,
		"username":     user.Username,
		"profileImage": user.ProfileImage,
		"age":          user.Age,
		"gender":       user.Gender,
	})
}
