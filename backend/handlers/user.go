package handlers

import (
	"net/http"
	"strconv"

	"portfolio-amarimono/handlers/utils"
	"portfolio-amarimono/models"

	"log"

	"strings"

	"os"

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

// CreateUser handles user creation (pure creation only, no sync logic)
func (h *UserHandler) CreateUser(c *gin.Context) {
	// デバッグ情報の追加
	log.Printf("🔍 CreateUser called - Headers: %v", c.Request.Header)
	log.Printf("🔍 CreateUser called - Method: %s", c.Request.Method)
	log.Printf("🔍 CreateUser called - Content-Type: %s", c.GetHeader("Content-Type"))

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("🔍 CreateUser - JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	log.Printf("🔍 CreateUser - User data received: %+v", user)

	// ユーザーIDの検証
	if user.ID == "" {
		log.Printf("🔍 CreateUser - User ID is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// メールアドレスの検証
	if user.Email == "" {
		log.Printf("🔍 CreateUser - Email is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	// 画像ファイルの処理
	if file, err := c.FormFile("image"); err == nil {
		log.Printf("🔍 CreateUser - Image file found: %s", file.Filename)
		// ファイルサイズのチェック（10MB制限）
		if file.Size > 10*1024*1024 {
			log.Printf("🔍 CreateUser - Image file too large: %d bytes", file.Size)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}

		// 画像を保存
		imagePath, err := utils.SaveImage(c, file, "users/"+user.ID, "")
		if err != nil {
			log.Printf("🔍 CreateUser - Failed to save image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		user.ProfileImage = &imagePath
	} else {
		log.Printf("🔍 CreateUser - No image file provided: %v", err)
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" {
			user.ProfileImage = &imageUrl
		}
	}

	log.Printf("🔍 CreateUser - Creating new user with ID: %s", user.ID)

	// 新規作成のみ（同期処理は含まない）
	if err := models.CreateUser(h.DB, &user); err != nil {
		log.Printf("🔍 CreateUser - Failed to create user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
		return
	}

	log.Printf("🔍 CreateUser - User created successfully: %s", user.ID)
	c.JSON(http.StatusCreated, user)
}

// SyncUser handles user synchronization (create if not exists, update if exists)
func (h *UserHandler) SyncUser(c *gin.Context) {
	// デバッグ情報の追加
	log.Printf("🔍 SyncUser called - Headers: %v", c.Request.Header)
	log.Printf("🔍 SyncUser called - Method: %s", c.Request.Method)
	log.Printf("🔍 SyncUser called - Content-Type: %s", c.GetHeader("Content-Type"))

	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("🔍 SyncUser - JSON binding error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	log.Printf("🔍 SyncUser - User data received: %+v", user)

	// ユーザーIDの検証
	if user.ID == "" {
		log.Printf("🔍 SyncUser - User ID is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// メールアドレスの検証
	if user.Email == "" {
		log.Printf("🔍 SyncUser - Email is empty")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	// 画像ファイルの処理
	if file, err := c.FormFile("image"); err == nil {
		log.Printf("🔍 SyncUser - Image file found: %s", file.Filename)
		// ファイルサイズのチェック（10MB制限）
		if file.Size > 10*1024*1024 {
			log.Printf("🔍 SyncUser - Image file too large: %d bytes", file.Size)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}

		// 画像を保存
		imagePath, err := utils.SaveImage(c, file, "users/"+user.ID, "")
		if err != nil {
			log.Printf("🔍 SyncUser - Failed to save image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		user.ProfileImage = &imagePath
	} else {
		log.Printf("🔍 SyncUser - No image file provided: %v", err)
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" {
			user.ProfileImage = &imageUrl
		}
	}

	log.Printf("🔍 SyncUser - Syncing user with ID: %s", user.ID)

	// 同期処理（存在しない場合は作成、存在する場合は更新）
	if err := models.SyncUser(h.DB, &user); err != nil {
		log.Printf("🔍 SyncUser - Failed to sync user: %v", err)
		log.Printf("🔍 SyncUser - Error type: %T", err)
		log.Printf("🔍 SyncUser - Error message: %s", err.Error())

		// 重複キーエラーの場合は特別な処理
		if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
			log.Printf("🔍 SyncUser - Duplicate key error, user already exists: %s", user.ID)
			// 既存のユーザーを取得して返す
			existingUser, err := models.GetUserByID(h.DB, user.ID)
			if err != nil {
				log.Printf("🔍 SyncUser - Error retrieving existing user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve existing user"})
				return
			}
			log.Printf("🔍 SyncUser - Existing user retrieved successfully: %s", existingUser.ID)
			c.JSON(http.StatusOK, existingUser)
			return
		}

		// 開発環境での追加デバッグ情報
		if os.Getenv("ENVIRONMENT") == "development" {
			log.Printf("🔍 SyncUser - Development environment - Full error details:")
			log.Printf("   User ID: %s", user.ID)
			log.Printf("   Email: %s", user.Email)
			log.Printf("   Username: %v", user.Username)
			log.Printf("   Age: %v", user.Age)
			log.Printf("   Gender: %v", user.Gender)
			log.Printf("   Request Headers: %v", c.Request.Header)
			log.Printf("   Content-Type: %s", c.GetHeader("Content-Type"))
		}

		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to sync user"})
		return
	}

	log.Printf("🔍 SyncUser - User synced successfully: %s", user.ID)
	c.JSON(http.StatusOK, user)
}

// GetUser handles retrieving a user (pure retrieval only, no sync logic)
func (h *UserHandler) GetUser(c *gin.Context) {
	userID := c.Param("id")
	log.Printf("🔍 GetUser - Retrieving user with ID: %s", userID)

	// 純粋な取得のみ（同期処理は含まない）
	user, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("🔍 GetUser - Error retrieving user: %v", err)
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve user"})
		}
		return
	}

	log.Printf("🔍 GetUser - User retrieved successfully: %s", user.ID)
	c.JSON(http.StatusOK, user)
}

// GetUserProfile handles retrieving a user's profile with role information
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	userID := c.Param("id")

	// ユーザー情報とrole情報を結合して取得
	var user struct {
		models.User
		Role string `json:"role"`
	}

	// usersテーブルとuser_rolesテーブルを結合して取得
	err := h.DB.Table("users").
		Select("users.*, user_roles.role").
		Joins("LEFT JOIN user_roles ON users.id = user_roles.user_id").
		Where("users.id = ?", userID).
		First(&user).Error

	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// roleがnullの場合はデフォルト値として"user"を設定
	if user.Role == "" {
		user.Role = "user"
	}

	c.JSON(http.StatusOK, user)
}

// UpdateUserProfile handles updating a user's profile (existing user update only)
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	userID := c.Param("id")

	// 既存のユーザーを取得
	existingUser, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// 画像ファイルの処理
	if file, err := c.FormFile("image"); err == nil {
		// ファイルサイズのチェック（10MB制限）
		if file.Size > 10*1024*1024 {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}

		// 既存の画像がある場合は削除
		if existingUser.ProfileImage != nil && *existingUser.ProfileImage != "" && *existingUser.ProfileImage != "[object File]" {
			if err := utils.DeleteImage(*existingUser.ProfileImage); err != nil {
				// 画像の削除に失敗しても処理は続行
			} else {
			}
		}

		// 新しい画像を保存
		imagePath, err := utils.SaveImage(c, file, "users/"+userID, "")
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		existingUser.ProfileImage = &imagePath
	} else {
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" && imageUrl != "[object File]" {
			existingUser.ProfileImage = &imageUrl
		}
	}

	// FormDataから他のフィールドを取得
	email := c.PostForm("email")
	username := c.PostForm("username")
	ageStr := c.PostForm("age")
	gender := c.PostForm("gender")

	// 年齢の変換
	var age *int
	if ageStr != "" {
		ageInt, err := strconv.Atoi(ageStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid age format"})
			return
		}
		age = &ageInt
	}

	// 各フィールドが空でない場合のみ更新
	if email != "" {
		existingUser.Email = email
	}
	if username != "" {
		existingUser.Username = &username
	}
	if age != nil {
		existingUser.Age = age
	}
	if gender != "" {
		existingUser.Gender = &gender
	}

	if err := models.UpdateUser(h.DB, existingUser); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, existingUser)
}

// DeleteUser handles user deletion (logical deletion)
func (h *UserHandler) DeleteUser(c *gin.Context) {
	userID := c.Param("id")
	if err := models.DeleteUser(h.DB, userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete user"})
		return
	}

	c.Status(http.StatusNoContent)
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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve average rating"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"average_rating": avgRating})
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

// UploadProfileImage handles uploading a user's profile image
func (h *UserHandler) UploadProfileImage(c *gin.Context) {
	userID := c.Param("id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// 画像ファイルを取得
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "No image file provided"})
		return
	}

	// ファイルサイズのチェック（10MB制限）
	if file.Size > 10*1024*1024 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
		return
	}

	// 画像を保存
	imagePath, err := utils.SaveImage(c, file, "users/"+userID, "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// ユーザーのプロフィール画像URLを更新
	user, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.ProfileImage = &imagePath
	if err := models.UpdateUser(h.DB, user); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user profile"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"imageUrl": imagePath})
}
