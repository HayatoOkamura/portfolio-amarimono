package handlers

import (
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
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDの形式が無効です"})
		return
	}
	if _, err := uuid.Parse(recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "レシピIDの形式が無効です"})
		return
	}

	var like models.Like
	result := h.DB.Where("user_id = ? AND recipe_id = ?", userID, recipeID).First(&like)

	if result.RowsAffected > 0 {
		// いいねが既に存在する場合は削除
		if err := h.DB.Delete(&like).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの削除に失敗しました"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "お気に入りから削除しました"})
	} else {
		// いいねがない場合は新規追加
		newLike := models.Like{UserID: userID, RecipeID: recipeID}
		if err := h.DB.Create(&newLike).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの追加に失敗しました"})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "お気に入りに追加しました"})
	}
}

// GetUserLikes ユーザーのお気に入りレシピを取得するエンドポイント
func (h *LikeHandler) GetUserLikes(c *gin.Context) {
	userID := c.Param("user_id")
	// UUIDのバリデーション
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDの形式が無効です"})
		return
	}

	var likes []models.Like
	if err := h.DB.Where("user_id = ?", userID).Find(&likes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの取得に失敗しました"})
		return
	}

	if len(likes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "お気に入りのレシピが見つかりません", "recipes": []models.Recipe{}})
		return
	}

	var recipes []models.Recipe
	for _, like := range likes {
		// RecipeIDがUUIDかチェック
		if _, err := uuid.Parse(like.RecipeID); err != nil {
			continue // 無効なRecipeIDはスキップ
		}

		var recipe models.Recipe
		if err := h.DB.Preload("Genre").Preload("Ingredients").Preload("Ingredients.Ingredient.Unit").First(&recipe, "id = ?", like.RecipeID).Error; err != nil {
			continue
		}

		recipes = append(recipes, recipe)
	}

	c.JSON(http.StatusOK, recipes)
}
