package handlers

import (
	"log"
	"net/http"
	"strconv"

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
		// PostgreSQLのユニーク制約違反エラーをチェック
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"users_pkey\" (SQLSTATE 23505)" {
			c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に登録されています"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー登録に失敗しました"})
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

// ユーザーが投稿したレシピのいいね数を取得
func (h *UserHandler) GetUserLikeCount(c *gin.Context) {
	userID := c.Param("id") // URLからユーザーIDを取得
	var likeCount int64

	err := h.DB.Table("likes").
		Joins("JOIN recipes ON likes.recipe_id = recipes.id").
		Where("recipes.user_id = ?", userID).
		Count(&likeCount).Error

	if err != nil {
		log.Printf("Failed to count likes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve like count"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"like_count": likeCount})
}

// ユーザーが投稿したレシピの平均レビュー評価を取得
func (h *UserHandler) GetUserRecipeAverageRating(c *gin.Context) {
	userID := c.Param("id") // URLからユーザーIDを取得
	var avgRating float64

	// ユーザーが作成したレシピの平均レビュー評価を取得
	err := h.DB.Table("recipes").
		Select("COALESCE(AVG(reviews.rating), 0)").
		Joins("LEFT JOIN reviews ON recipes.id = reviews.recipe_id").
		Where("recipes.user_id = ?", userID).
		Scan(&avgRating).Error

	if err != nil {
		log.Printf("Failed to get average rating: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve average rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"average_rating": avgRating})
}

// UpdateUserProfile ユーザーのプロフィールを更新するハンドラー
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	userID := c.Param("id") // URLのパラメータから userID を取得
	log.Println("⭐️⭐️⭐️ User ID:", userID)

	// フォームデータを取得
	form, err := c.MultipartForm()
	if err != nil {
		log.Println("Form parsing error:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	// 更新データを格納するマップ
	updateFields := map[string]interface{}{}

	// フォームデータの取得と更新処理
	if username, exists := form.Value["username"]; exists && len(username) > 0 {
		updateFields["username"] = username[0]
	}
	if ageStr, exists := form.Value["age"]; exists && len(ageStr) > 0 {
		age, err := strconv.Atoi(ageStr[0])
		if err != nil {
			log.Println("Invalid age format:", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age format"})
			return
		}
		updateFields["age"] = age
	}
	if gender, exists := form.Value["gender"]; exists && len(gender) > 0 {
		updateFields["gender"] = gender[0]
	}

	// 画像アップロード処理
	if files, exists := form.File["profileImage"]; exists && len(files) > 0 {
		profileImage := files[0]

		// 画像を保存し、パスを取得
		imageURL, err := utils.SaveImage(c, profileImage, "user")
		if err != nil {
			log.Printf("File upload error: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to upload profile image"})
			return
		}
		updateFields["profile_image"] = imageURL
	}

	// 更新処理（`updateFields` が空でない場合のみ実行）
	if len(updateFields) > 0 {
		if err := h.DB.Model(&models.User{}).Where("id = ?", userID).Updates(updateFields).Error; err != nil {
			log.Println("Failed to update user:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update profile"})
			return
		}
	}

	c.JSON(http.StatusOK, gin.H{"message": "Profile updated successfully"})
}
