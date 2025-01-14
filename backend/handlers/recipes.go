package handlers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"portfolio-amarimono/models"
)

type FetchRecipesFunc func(ingredientIDs []int, quantities []int) ([]models.Recipe, error)

type RecipeHandler struct {
	FetchRecipes FetchRecipesFunc
}

type Ingredient struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Genre    string `json:"genre"`
	Quantity int    `json:"quantity"`
	ImageUrl string `json:"image_url"`
}

// GenerateRecipes handles POST /api/recipes
func (h *RecipeHandler) GenerateRecipes(c *gin.Context) {
	var ingredients []Ingredient

	if err := c.BindJSON(&ingredients); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request"})
		return
	}

	ingredientIDs := []int{}
	quantities := []int{}
	for _, ing := range ingredients {
		ingredientIDs = append(ingredientIDs, ing.ID)
		quantities = append(quantities, ing.Quantity)
	}

	recipes, err := h.FetchRecipes(ingredientIDs, quantities)
	if err != nil {
		log.Printf("Failed to fetch recipes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed!!", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}
