package handlers

import (
	"net/http"
	"portfolio-amarimono/db"

	"github.com/gin-gonic/gin"
)

// IngredientHandler 構造体
type IngredientHandler struct{}

// GET /api/ingredients
func (h *IngredientHandler) GetIngredients(c *gin.Context) {
	var ingredients []Ingredient

	// DB から全具材を取得
	result := db.DB.Find(&ingredients)
	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}

// POST /api/ingredients
func (h *IngredientHandler) AddIngredient(c *gin.Context) {
	var newIngredient Ingredient
	if err := c.ShouldBindJSON(&newIngredient); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// 具材の存在チェック
	var exists Ingredient
	if err := db.DB.Where("name = ?", newIngredient.Name).First(&exists).Error; err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材の登録
	if err := db.DB.Create(&newIngredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to insert ingredient"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Ingredient added successfully"})
}

