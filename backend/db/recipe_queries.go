package db

import (
	"log"
)

// FetchRecipes queries recipes based on ingredients
func FetchRecipes(ingredientIDs []int, quantities []int) ([]Recipe, error) {
	var recipes []Recipe
	// クエリ条件を構築
	query := `
		SELECT DISTINCT r.id, r.name, r.instructions
		FROM recipes r
		JOIN recipe_ingredients ri ON r.id = ri.recipe_id
		WHERE ri.ingredient_id = ANY($1) AND ri.quantity <= ANY($2)`

	// GORM を使用してクエリを実行
	result := DB.Raw(query, ingredientIDs, quantities).Scan(&recipes)

	if result.Error != nil {
		log.Printf("Failed to fetch recipes: %v", result.Error)
		return nil, result.Error
	}

	log.Printf("Recipes fetched: %v", recipes)
	return recipes, nil
}
