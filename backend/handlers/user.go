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
	age, err := strconv.Atoi(form.Value["age"][0])
	if err != nil {
		log.Printf("Invalid age format: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age format"})
		return
	}

	user := models.User{
		ID:       form.Value["id"][0],       // ID
		Email:    form.Value["email"][0],    // Email
		Username: form.Value["username"][0], // ユーザー名
		Age:      age,                       // 年齢（整数に変換済み）
		Gender:   form.Value["gender"][0],   // 性別
	}

	// ユーザーが既に存在するか確認
	var existingUser models.User
	if err := h.DB.Where("id = ?", user.ID).First(&existingUser).Error; err == nil {
		// ユーザーが存在する場合は更新
		if err := h.DB.Model(&models.User{}).Where("id = ?", user.ID).Updates(user).Error; err != nil {
			log.Printf("Failed to update user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の更新に失敗しました"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
		return
	}

	// ユーザーが存在しない場合は新規作成
	if err := models.CreateUser(h.DB, user); err != nil {
		log.Printf("Failed to create user: %v", err)
		// 重複エラーの場合は更新を試みる
		if err.Error() == "ERROR: duplicate key value violates unique constraint \"users_pkey\" (SQLSTATE 23505)" {
			if err := h.DB.Model(&models.User{}).Where("id = ?", user.ID).Updates(user).Error; err != nil {
				log.Printf("Failed to update user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の更新に失敗しました"})
				return
			}
			c.JSON(http.StatusOK, gin.H{"message": "User updated successfully"})
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

// UpdateUserProfile ユーザーのプロフィール情報を更新するハンドラー
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

		// 画像を保存し、パスを取得（ユーザーIDのディレクトリに保存）
		imageURL, err := utils.SaveImage(c, profileImage, "users", userID)
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
