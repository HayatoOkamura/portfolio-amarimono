package handlers

import (
	"bytes"
	"fmt"
	"io"
	"log"
	"net/http"

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

	c.JSON(http.StatusOK, user)
}

// GetUserProfile handles retrieving a user's profile
func (h *UserHandler) GetUserProfile(c *gin.Context) {
	fmt.Println("🔥GetUserProfile")
	userID := c.Param("id")
	log.Printf("GetUserProfile - Request received for user ID: %s", userID)

	user, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("GetUserProfile - Failed to retrieve user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, user)
}

// UpdateUserProfile handles updating a user's profile
func (h *UserHandler) UpdateUserProfile(c *gin.Context) {
	fmt.Println("🔥UpdateUserProfile")
	userID := c.Param("id")
	log.Printf("📝 UpdateUserProfile - Request received for user ID: %s", userID)

	// リクエストボディをログ出力
	body, err := c.GetRawData()
	if err != nil {
		log.Printf("❌ Error reading request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	log.Printf("📦 Raw request body: %s", string(body))

	// リクエストボディを元に戻す（後でShouldBindJSONで使用するため）
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	// 更新用のリクエストデータ構造体
	type UpdateUserRequest struct {
		Email        *string `json:"email"`
		Username     *string `json:"username"`
		Age          *int    `json:"age"`
		Gender       *string `json:"gender"`
		ProfileImage *string `json:"profile_image"`
	}

	var updateData UpdateUserRequest
	if err := c.ShouldBindJSON(&updateData); err != nil {
		log.Printf("❌ Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user data"})
		return
	}
	log.Printf("📝 Parsed update data: %+v", updateData)

	// 既存のユーザーを取得
	existingUser, err := models.GetUserByID(h.DB, userID)
	if err != nil {
		log.Printf("❌ Error getting existing user: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}
	log.Printf("📝 Existing user data: %+v", existingUser)

	// 更新するフィールドのみを設定
	if updateData.Email != nil {
		existingUser.Email = *updateData.Email
	}
	if updateData.Username != nil {
		existingUser.Username = updateData.Username
	}
	if updateData.Age != nil {
		existingUser.Age = updateData.Age
	}
	if updateData.Gender != nil {
		existingUser.Gender = updateData.Gender
	}
	if updateData.ProfileImage != nil {
		existingUser.ProfileImage = updateData.ProfileImage
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
