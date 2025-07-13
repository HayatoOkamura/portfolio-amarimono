package handlers

import (
	"math"
	"net/http"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecommendationHandler struct {
	DB *gorm.DB
}

func NewRecommendationHandler(db *gorm.DB) *RecommendationHandler {
	return &RecommendationHandler{DB: db}
}

// GetRecommendedRecipes ユーザーのいいね履歴をもとにおすすめレシピを取得
func (h *RecommendationHandler) GetRecommendedRecipes(c *gin.Context) {
	userID := c.Param("user_id")

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

	// ユーザーがいいねしたレシピの取得
	var recipes []models.Recipe
	genreCount := make(map[string]int)
	var totalCost, totalCookingTime float64

	for _, like := range likes {
		var recipe models.Recipe
		if err := h.DB.Preload("Genre").First(&recipe, "id = ?", like.RecipeID).Error; err != nil {
			continue
		}
		recipes = append(recipes, recipe)
		genreCount[recipe.Genre.Name]++
		totalCost += float64(recipe.CostEstimate)
		totalCookingTime += float64(recipe.CookingTime)
	}

	if len(recipes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "No valid liked recipes found", "recipes": []models.Recipe{}})
		return
	}

	// 平均値の計算
	avgCost := totalCost / float64(len(recipes))
	avgCookingTime := totalCookingTime / float64(len(recipes))

	// ジャンルの割合を計算
	totalLikes := len(recipes)
	var genreRatios = make(map[string]float64)
	for genre, count := range genreCount {
		genreRatios[genre] = float64(count) / float64(totalLikes)
	}

	// おすすめレシピの取得
	var recommendedRecipes []models.Recipe
	query := h.DB.Preload("Genre").Where("cost_estimate BETWEEN ? AND ?", int(avgCost*0.8), int(avgCost*1.2)).
		Where("cooking_time BETWEEN ? AND ?", int(avgCookingTime*0.8), int(avgCookingTime*1.2))

	if err := query.Find(&recommendedRecipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recommended recipes"})
		return
	}

	// ジャンルの割合に基づいてフィルタリング
	finalRecommendations := []models.Recipe{}
	genreLimit := make(map[string]int)
	for genre, ratio := range genreRatios {
		genreLimit[genre] = int(math.Max(1, math.Round(ratio*float64(len(recommendedRecipes)))))
	}

	genreCountSelected := make(map[string]int)
	for _, recipe := range recommendedRecipes {
		if genreCountSelected[recipe.Genre.Name] < genreLimit[recipe.Genre.Name] {
			finalRecommendations = append(finalRecommendations, recipe)
			genreCountSelected[recipe.Genre.Name]++
		}
	}

	c.JSON(http.StatusOK, finalRecommendations)
}
