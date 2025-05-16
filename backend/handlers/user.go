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
	var agePtr *int
	if ageStr := form.Value["age"][0]; ageStr != "" {
		age, err := strconv.Atoi(ageStr)
		if err != nil {
			log.Printf("Invalid age format: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age format"})
			return
		}
		agePtr = &age
	}

	// 性別のデフォルト値を設定
	var genderPtr *string
	if len(form.Value["gender"]) > 0 {
		genderValue := form.Value["gender"][0]
		// 数値が渡された場合は文字列に変換
		if genderValue == "0" {
			gender := "未設定"
			genderPtr = &gender
		} else if genderValue == "1" {
			gender := "男性"
			genderPtr = &gender
		} else if genderValue == "2" {
			gender := "女性"
			genderPtr = &gender
		} else {
			genderPtr = &genderValue
		}
	}

	username := form.Value["username"][0]
	user := models.User{
		ID:           form.Value["id"][0],
		Email:        form.Value["email"][0],
		Username:     &username,
		Age:          agePtr,
		Gender:       genderPtr,
		ProfileImage: nil,
	}

	// トランザクションを開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		log.Printf("Failed to start transaction: %v", tx.Error)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	// ユーザーが既に存在するか確認
	var existingUser models.User
	result := tx.Where("id = ?", user.ID).First(&existingUser)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// ユーザーが存在しない場合は新規作成
			if err := tx.Create(&user).Error; err != nil {
				tx.Rollback()
				log.Printf("Failed to create user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー登録に失敗しました"})
				return
			}
		} else {
			tx.Rollback()
			log.Printf("Database error: %v", result.Error)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラーが発生しました"})
			return
		}
	} else {
		// ユーザーが存在する場合は更新
		if err := tx.Model(&models.User{}).Where("id = ?", user.ID).Updates(user).Error; err != nil {
			tx.Rollback()
			log.Printf("Failed to update user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー情報の更新に失敗しました"})
			return
		}
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		log.Printf("Failed to commit transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Internal server error"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User created successfully"})
}

// GetUserProfile ユーザーのプロフィール情報を取得するハンドラー
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID := c.Param("id") // URLのパラメータからuserIDを取得
	log.Printf("GetUserProfile - Request received for user ID: %s", userID)

	user, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("GetUserProfile - Failed to retrieve user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	log.Printf("GetUserProfile - User found: %+v", user)

	// ユーザーのロール情報を取得
	var role string
	result := h.DB.Table("user_roles").
		Select("role").
		Where("user_id = ?", userID).
		Scan(&role)

	if result.Error != nil {
		log.Printf("GetUserProfile - Error fetching user role: %v", result.Error)
	} else {
		log.Printf("GetUserProfile - User role: %s", role)
	}

	response := gin.H{
		"id":           user.ID,
		"email":        user.Email,
		"username":     user.Username,
		"profileImage": user.ProfileImage,
		"age":          user.Age,
		"gender":       user.Gender,
		"role":         role,
	}
	log.Printf("GetUserProfile - Sending response: %+v", response)

	c.JSON(http.StatusOK, response)
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

		// 現在のプロフィール画像を取得
		var currentUser models.User
		if err := h.DB.First(&currentUser, "id = ?", userID).Error; err != nil {
			log.Printf("Failed to get current user: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get current user"})
			return
		}

		// 古い画像が存在する場合は削除
		if currentUser.ProfileImage != nil {
			if err := utils.DeleteImage(*currentUser.ProfileImage); err != nil {
				log.Printf("Failed to delete old profile image: %v", err)
				// エラーをログに記録するが、処理は続行
			}
		}

		// 新しい画像を保存し、パスを取得（ユーザーIDのディレクトリに保存）
		imageURL, err := utils.SaveImage(c, profileImage, "users/"+userID, "profile")
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

// SetUserRole ユーザーのロールを設定するハンドラー
func (h *UserHandler) SetUserRole(c *gin.Context) {
	// リクエストユーザーの認証チェック
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// リクエストユーザーが管理者かチェック
	var requesterRole struct {
		Role string
	}
	if err := h.DB.Table("user_roles").Where("user_id = ?", userID).First(&requesterRole).Error; err != nil {
		c.JSON(http.StatusForbidden, gin.H{"error": "管理者権限が必要です"})
		return
	}
	if requesterRole.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "管理者権限が必要です"})
		return
	}

	// リクエストボディから対象ユーザーIDとロールを取得
	var requestBody struct {
		UserID string `json:"user_id" binding:"required"`
		Role   string `json:"role" binding:"required,oneof=admin user"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "無効なリクエストです"})
		return
	}

	// トランザクションを開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラーが発生しました"})
		return
	}

	// 既存のロールを確認
	var existingRole struct {
		Role string
	}
	result := tx.Table("user_roles").Where("user_id = ?", requestBody.UserID).First(&existingRole)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			// 新規作成
			if err := tx.Table("user_roles").Create(map[string]interface{}{
				"user_id": requestBody.UserID,
				"role":    requestBody.Role,
			}).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "ロールの設定に失敗しました"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラーが発生しました"})
			return
		}
	} else {
		// 更新
		if err := tx.Table("user_roles").Where("user_id = ?", requestBody.UserID).Update("role", requestBody.Role).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "ロールの更新に失敗しました"})
			return
		}
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラーが発生しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "ロールを設定しました"})
}
