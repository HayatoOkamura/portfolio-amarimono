package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"portfolio-amarimono/models"
	"portfolio-amarimono/db"
)

type FetchRecipesFunc func(ingredientIDs []int, quantities []int) ([]db.RecipeWithIngredients, error)

type RecipeHandler struct {
	FetchRecipes FetchRecipesFunc
}

// GenerateRecipes handles POST /api/recipes
func (h *RecipeHandler) GenerateRecipes(c *gin.Context) {
	var ingredients []models.RecipeIngredient

	if err := c.BindJSON(&ingredients); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ingredientIDs := []int{}
	quantities := []int{}

	for _, ing := range ingredients {
		ingredientIDs = append(ingredientIDs, ing.IngredientID)
		quantities = append(quantities, ing.QuantityRequired)
	}

	recipes, err := h.FetchRecipes(ingredientIDs, quantities)
	if err != nil {
		log.Printf("Failed to fetch recipes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed!!", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}
