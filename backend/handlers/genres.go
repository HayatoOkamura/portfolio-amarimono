package handlers

import (
	"net/http"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type GenreHandler struct {
	DB *gorm.DB
}

// レシピのジャンルをリスト
func (h *GenreHandler) ListRecipeGenres(c *gin.Context) {
	var genres []models.RecipeGenre
	if err := h.DB.Find(&genres).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe genres"})
		return
	}
	c.JSON(http.StatusOK, genres)
}

// 食材のジャンルをリスト
func (h *GenreHandler) ListIngredientGenres(c *gin.Context) {
	var genres []models.IngredientGenre
	if err := h.DB.Find(&genres).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient genres"})
		return
	}

	c.JSON(http.StatusOK, genres)
}
