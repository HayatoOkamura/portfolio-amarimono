package handlers

import (
	"log"
	"net/http"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LikeHandler struct {
	DB *gorm.DB
}

func NewLikeHandler(db *gorm.DB) *LikeHandler {
	return &LikeHandler{
		DB: db,
	}
}

// ToggleUserLike ユーザーのいいねを追加/削除するエンドポイント
func (h *LikeHandler) ToggleUserLike(c *gin.Context) {
	userID := c.Param("user_id")
	recipeID := c.Param("recipe_id")

	// UUIDのバリデーション
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}
	if _, err := uuid.Parse(recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID format"})
		return
	}

	var like models.Like
	result := h.DB.Where("user_id = ? AND recipe_id = ?", userID, recipeID).First(&like)

	if result.RowsAffected > 0 {
		// いいねが既に存在する場合は削除
		if err := h.DB.Delete(&like).Error; err != nil {
			log.Println("❌ Failed to delete like:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to remove like"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Like removed"})
	} else {
		// いいねがない場合は新規追加
		newLike := models.Like{UserID: userID, RecipeID: recipeID}
		if err := h.DB.Create(&newLike).Error; err != nil {
			log.Println("❌ Failed to create like:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add like"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "Like added"})
	}
}

// GetUserLikes ユーザーのお気に入りレシピを取得するエンドポイント
func (h *LikeHandler) GetUserLikes(c *gin.Context) {
	userID := c.Param("user_id")
	log.Println("🚨🚨🚨", userID)
	// UUIDのバリデーション
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	var likes []models.Like
	if err := h.DB.Where("user_id = ?", userID).Find(&likes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch likes"})
		return
	}

	if len(likes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No liked recipes found", "recipes": []models.Recipe{}})
		return
	}

	var recipes []models.Recipe
	for _, like := range likes {
		// RecipeIDがUUIDかチェック
		if _, err := uuid.Parse(like.RecipeID); err != nil {
			log.Println("❌ Invalid Recipe ID:", like.RecipeID)
			continue // 無効なRecipeIDはスキップ
		}

		var recipe models.Recipe
		if err := h.DB.Preload("Genre").Preload("Ingredients").Preload("Ingredients.Ingredient.Unit").First(&recipe, "id = ?", like.RecipeID).Error; err != nil {
			log.Println("⚠️ Failed to fetch recipe:", like.RecipeID, "Error:", err)
			continue
		}

		recipes = append(recipes, recipe)
	}

	c.JSON(http.StatusOK, recipes)
}
