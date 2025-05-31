package handlers

import (
	"fmt"
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

// CreateUser handles user creation
func (h *UserHandler) CreateUser(c *gin.Context) {
	fmt.Println("🔥CreateUser")
	var user models.User
	if err := c.ShouldBindJSON(&user); err != nil {
		log.Printf("Error binding user data: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}

	// ユーザーIDの検証
	if user.ID == "" {
		log.Printf("Error: User ID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// メールアドレスの検証
	if user.Email == "" {
		log.Printf("Error: Email is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Email is required"})
		return
	}

	// 画像ファイルの処理
	if file, err := c.FormFile("image"); err == nil {
		log.Printf("📸 Image upload detected for user: %s", user.ID)
		log.Printf("📸 Image details - Filename: %s, Size: %d bytes", file.Filename, file.Size)

		// ファイルサイズのチェック（10MB制限）
		if file.Size > 10*1024*1024 {
			log.Printf("❌ Error: Image file size exceeds 10MB limit")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}

		// 画像を保存
		imagePath, err := utils.SaveImage(c, file, "users/"+user.ID, "")
		if err != nil {
			log.Printf("❌ Error saving image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		log.Printf("✅ Image successfully uploaded to: %s", imagePath)
		user.ProfileImage = &imagePath
	} else {
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" {
			user.ProfileImage = &imageUrl
		}
		log.Printf("ℹ️ No image file provided for user: %s", user.ID)
	}

	// 既存のユーザーを確認
	existingUser, err := models.GetUserByID(h.DB, user.ID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// ユーザーが存在しない場合は新規作成
			if err := models.CreateUser(h.DB, &user); err != nil {
				log.Printf("Error creating user: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create user"})
				return
			}
			log.Printf("✅ User created successfully with ID: %s", user.ID)
			c.JSON(http.StatusCreated, user)
			return
		}
		// その他のエラーの場合
		log.Printf("Error checking existing user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check existing user"})
		return
	}

	// ユーザーが既に存在する場合は更新
	user.CreatedAt = existingUser.CreatedAt // 作成日時は保持
	if err := models.UpdateUser(h.DB, &user); err != nil {
		log.Printf("Error updating user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	log.Printf("✅ User updated successfully with ID: %s", user.ID)
	c.JSON(http.StatusOK, user)
}

// GetUserProfile handles retrieving a user's profile
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	fmt.Println("🔥GetUserProfile")
	userID := c.Param("id")
	log.Printf("GetUserProfile - Request received for user ID: %s", userID)

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
		log.Printf("GetUserProfile - Failed to retrieve user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	// roleがnullの場合はデフォルト値として"user"を設定
	if user.Role == "" {
		user.Role = "user"
	}

	c.JSON(http.StatusOK, user)
}

// UpdateUserProfile handles updating a user's profile
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	fmt.Println("🔥UpdateUserProfile")
	userID := c.Param("id")
	log.Printf("📝 UpdateUserProfile - Request received for user ID: %s", userID)

	// 既存のユーザーを取得
	existingUser, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("❌ Error getting existing user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	log.Printf("📝 Existing user data: %+v", existingUser)

	// 画像ファイルの処理
	if file, err := c.FormFile("image"); err == nil {
		log.Printf("📸 Image upload detected for user: %s", userID)
		log.Printf("📸 Image details - Filename: %s, Size: %d bytes", file.Filename, file.Size)

		// ファイルサイズのチェック（10MB制限）
		if file.Size > 10*1024*1024 {
			log.Printf("❌ Error: Image file size exceeds 10MB limit")
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}

		// 既存の画像がある場合は削除
		if existingUser.ProfileImage != nil && *existingUser.ProfileImage != "" && *existingUser.ProfileImage != "[object File]" {
			log.Printf("🗑️ Deleting existing image: %s", *existingUser.ProfileImage)
			if err := utils.DeleteImage(*existingUser.ProfileImage); err != nil {
				log.Printf("⚠️ Warning: Failed to delete existing image: %v", err)
				// 画像の削除に失敗しても処理は続行
			} else {
				log.Printf("✅ Successfully deleted existing image")
			}
		}

		// 新しい画像を保存
		imagePath, err := utils.SaveImage(c, file, "users/"+userID, "")
		if err != nil {
			log.Printf("❌ Error saving image: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		log.Printf("✅ Image successfully uploaded to: %s", imagePath)
		existingUser.ProfileImage = &imagePath
	} else {
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" && imageUrl != "[object File]" {
			existingUser.ProfileImage = &imageUrl
		}
		log.Printf("ℹ️ No image file provided for user: %s", userID)
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
			log.Printf("❌ Error converting age: %v", err)
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

	log.Printf("📝 Updating user with data: %+v", existingUser)
	if err := models.UpdateUser(h.DB, existingUser); err != nil {
		log.Printf("❌ Error updating user: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	log.Printf("✅ User updated successfully: %+v", existingUser)
	c.JSON(http.StatusOK, existingUser)
}

// DeleteUser handles user deletion
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
