package handlers

import (
	"log"
	"net/http"
	"portfolio-amarimono/db"

	"github.com/gin-gonic/gin"
)

type FetchRecipesFunc func(ingredientIDs []int, quantities []int) ([]db.Recipe, error)

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

type Recipe struct {
	ID           int    `json:"id"`
	Name         string `json:"name"`
	Instructions string `json:"instructions"`
}

// GetRecipes handles POST /api/recipes
func (h *RecipeHandler) GetRecipes(c *gin.Context) {
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
