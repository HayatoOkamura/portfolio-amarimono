package handlers

import (
	"fmt"
	"net/http"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ReviewHandler struct {
	DB *gorm.DB
}

// NewReviewHandler は ReviewHandler を初期化するコンストラクタ
func NewReviewHandler(db *gorm.DB) *ReviewHandler {
	return &ReviewHandler{
		DB: db,
	}
}

// AddReview レシピにレビューを追加する
func (h *ReviewHandler) AddReview(c *gin.Context) {
	var review models.Review

	// リクエストボディを review 構造体に直接バインド
	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		return
	}

	if err := h.DB.Create(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add review"})
		return
	}

	c.JSON(http.StatusCreated, review)
}

// GetReviewsByRecipeID レシピIDに紐づくレビューを取得する
func (h *ReviewHandler) GetReviewsByRecipeID(c *gin.Context) {
	recipeID := c.Param("recipe_id")
	var reviews []models.Review

	// レシピIDに紐づくレビューを検索
	if err := h.DB.Where("recipe_id = ?", recipeID).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	// デバッグログ: 取得したレビューデータをログ出力
	for i, review := range reviews {
		c.Writer.Header().Set("X-Debug-Review-"+string(rune(i)),
			fmt.Sprintf("ID:%s,RecipeID:%s,UserID:%s,Rating:%d,Comment:%s,CreatedAt:%s,UpdatedAt:%s",
				review.ID, review.RecipeID, review.UserID, review.Rating, review.Comment,
				review.CreatedAt.Format("2006-01-02 15:04:05"),
				review.UpdatedAt.Format("2006-01-02 15:04:05")))
	}

	c.JSON(http.StatusOK, reviews)
}

// GetReviewsByUserID ユーザーIDに紐づくレビューを取得する
func (h *ReviewHandler) GetReviewsByUserID(c *gin.Context) {
	userIDStr := c.Param("user_id")
	var reviews []models.Review

	// ユーザーIDに紐づくレビューを検索
	if err := h.DB.Where("user_id = ?", userIDStr).Find(&reviews).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch reviews"})
		return
	}

	c.JSON(http.StatusOK, reviews)
}

// UpdateReview レビューを更新する
func (h *ReviewHandler) UpdateReview(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	var review models.Review
	// レビューIDで検索
	if err := h.DB.First(&review, id).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Review not found"})
		return
	}

	// リクエストボディを読み込み
	if err := c.ShouldBindJSON(&review); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// レビューを更新
	if err := h.DB.Save(&review).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update review"})
		return
	}

	c.JSON(http.StatusOK, review)
}

// DeleteReview レビューを削除する
func (h *ReviewHandler) DeleteReview(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid review ID"})
		return
	}

	// レビューIDで削除
	if err := h.DB.Delete(&models.Review{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete review"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Review deleted"})
}
