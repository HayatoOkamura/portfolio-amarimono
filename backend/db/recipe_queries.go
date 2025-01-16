package db

import (
	"log"
	"portfolio-amarimono/models"

	"github.com/lib/pq"
)

type RecipeWithIngredients struct {
	Recipe      models.Recipe      `json:"recipe"`
	Ingredients []models.Ingredient `json:"ingredients"`
}

// FetchRecipes queries recipes based on ingredients and quantities
func FetchRecipes(ingredientIDs []int, quantities []int) ([]RecipeWithIngredients, error) {
	var recipes []models.Recipe
	var ingredients []models.Ingredient
	var result []RecipeWithIngredients

	// GORMのPreloadを使用して具材情報をロード
	// レシピのみ取得
	recipeResult := DB.Joins("JOIN recipe_ingredients ri ON recipes.id = ri.recipe_id").
		Where("ri.ingredient_id IN ?", ingredientIDs).
		Where("ri.quantity_required <= ANY(?)", pq.Array(quantities)).
		Find(&recipes)

	if recipeResult.Error != nil {
		log.Printf("Failed to fetch recipes: %v", recipeResult.Error)
		return nil, recipeResult.Error
	}

	// Fetch ingredients
	ingredientResult := DB.Joins("JOIN recipe_ingredients ri ON ingredients.id = ri.ingredient_id").
		Where("ri.ingredient_id IN ?", ingredientIDs).
		Find(&ingredients)

	if ingredientResult.Error != nil {
		log.Printf("Failed to fetch ingredients: %v", ingredientResult.Error)
		return nil, ingredientResult.Error
	}

	// Combine recipes and ingredients
	for _, recipe := range recipes {
		result = append(result, RecipeWithIngredients{
			Recipe:      recipe,
			Ingredients: ingredients,
		})
	}

	return result, nil
}
