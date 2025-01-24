package db

import (
	"log"
	"portfolio-amarimono/models"
)

type RecipeWithIngredients struct {
	Recipe      models.Recipe       `json:"recipe"`
	Ingredients []models.Ingredient `json:"ingredients"`
}

// FetchRecipes queries recipes based on ingredients and quantities
func FetchRecipes(ingredientIDs []int, quantities []int) ([]RecipeWithIngredients, error) {
	var recipes []models.Recipe
	var result []RecipeWithIngredients

	// マップで数量を管理
	quantityMap := make(map[int]int)
	for i, id := range ingredientIDs {
		quantityMap[id] = quantities[i]
	}

	// サブクエリ：すべての指定具材が含まれるレシピを取得
	subQuery := DB.Table("recipe_ingredients").
		Select("recipe_id").
		Where("ingredient_id IN ?", ingredientIDs).
		Group("recipe_id").
		Having("COUNT(recipe_id) = (SELECT COUNT(*) FROM recipe_ingredients WHERE recipe_id = recipes.id)")

	// レシピと関連具材をロード
	err := DB.Preload("Ingredients").
		Preload("Genre").
		Where("id IN (?)", subQuery).
		Find(&recipes).Error
	if err != nil {
		log.Printf("Failed to fetch recipes: %v", err)
		return nil, err
	}

	// 結果をフィルタリング
	for _, recipe := range recipes {
		log.Printf("テストぉ！！！！！: %v", recipe)
		allIngredientsMatch := true
		var matchedIngredients []models.Ingredient

		for _, ing := range recipe.Ingredients {
			// 指定数量未満の具材があればスキップ
			if quantityMap[ing.IngredientID] < ing.QuantityRequired {
				allIngredientsMatch = false
				break
			}

			// 対応する具材を取得してマッチングリストに追加
			var ingredient models.Ingredient
			if err := DB.First(&ingredient, ing.IngredientID).Error; err != nil {
				log.Printf("Failed to fetch ingredient details: %v", err)
				return nil, err
			}
			matchedIngredients = append(matchedIngredients, ingredient)
		}

		// 条件を満たすレシピを結果に追加
		if allIngredientsMatch {
			result = append(result, RecipeWithIngredients{
				Recipe:      recipe,
				Ingredients: matchedIngredients,
			})
		}
	}

	return result, nil
}
