package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

// Ingredient は具材モデル
type AdminIngredient struct {
	Name string `json:"name" binding:"required"` // 必須フィールドとして設定
}

// レシピ追加用モデル
type RecipeRequest struct {
	Name         string `json:"name"`
	Instructions string `json:"instructions"`
	Ingredients  []struct {
		ID       int `json:"id"`
		Quantity int `json:"quantity"`
	} `json:"ingredients"`
}

// ListIngredients 具材一覧を取得
func (h *AdminHandler) ListIngredients(c *gin.Context) {
	var ingredients []Ingredient
	if err := h.DB.Table("ingredients").Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients"})
		return
	}
	c.JSON(http.StatusOK, ingredients)
}

// AddIngredient 具材を追加
func (h *AdminHandler) AddIngredient(c *gin.Context) {
	var ingredient AdminIngredient
	if err := c.ShouldBindJSON(&ingredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// 既存の具材名をチェック
	var count int64
	h.DB.Table("ingredients").Where("name = ?", ingredient.Name).Count(&count)
	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材を追加
	if err := h.DB.Table("ingredients").Create(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"message": "Ingredient added successfully", "ingredient": ingredient})
}

// AddRecipe レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {
	var req RecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// トランザクションで処理
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// レシピを作成
		recipe := map[string]interface{}{
			"name":         req.Name,
			"instructions": req.Instructions,
		}
		if err := tx.Table("recipes").Create(&recipe).Error; err != nil {
			return err
		}

		// 作成したレシピIDを取得
		recipeID := recipe["id"].(int)

		// レシピに必要な具材を登録
		for _, ing := range req.Ingredients {
			recipeIngredient := map[string]interface{}{
				"recipe_id":     recipeID,
				"ingredient_id": ing.ID,
				"quantity":      ing.Quantity,
			}
			if err := tx.Table("recipe_ingredients").Create(&recipeIngredient).Error; err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Recipe added successfully"})
}
