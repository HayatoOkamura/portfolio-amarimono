package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"portfolio-amarimono/models"
	"portfolio-amarimono/utils"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type RecipeHandler struct {
	DB *gorm.DB
}

// NewRecipeHandler は RecipeHandler を初期化するコンストラクタ
func NewRecipeHandler(db *gorm.DB) *RecipeHandler {
	return &RecipeHandler{
		DB: db,
	}
}

type RecipeIngredientRequest struct {
	IngredientID     int     `json:"ingredientId"`
	QuantityRequired float64 `json:"quantityRequired"`
	UnitName         string  `json:"unitName"`
}

// SearchRequestの構造を変更
type SearchRequest struct {
	Ingredients    []RecipeIngredientRequest `json:"ingredients"`
	IgnoreQuantity bool                      `json:"ignoreQuantity"`
	SearchMode     string                    `json:"searchMode"`
}

// SerchRecipes handles POST /api/recipes
func (h *RecipeHandler) SerchRecipes(c *gin.Context) {
	var request SearchRequest

	// 受信したリクエストボディをログに出力
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	log.Println("🥦 Request body:", string(body))

	// JSONデコードを試みる
	if err := json.Unmarshal(body, &request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		return
	}

	// 検索モードのデフォルト値を設定（後方互換性のため）
	if request.SearchMode == "" {
		if request.IgnoreQuantity {
			request.SearchMode = "exact_without_quantity"
		} else {
			request.SearchMode = "exact_with_quantity"
		}
	}

	// 選択された具材のマップを作成（IDをキーとして、数量を値として）
	selectedIngredients := make(map[int]float64)
	var ingredientIDs []int
	for _, ing := range request.Ingredients {
		selectedIngredients[ing.IngredientID] = ing.QuantityRequired
		ingredientIDs = append(ingredientIDs, ing.IngredientID)
	}
	log.Printf("🥦 Selected ingredients: %+v\n", selectedIngredients)
	log.Printf("🥦 Search mode: %s\n", request.SearchMode)

	// サブクエリ：指定具材が含まれるレシピを取得（下書きを除外）
	var recipeIDs []uuid.UUID
	if err := h.DB.Table("recipe_ingredients").
		Select("recipe_id").
		Where("ingredient_id IN ?", ingredientIDs).
		Group("recipe_id").
		Pluck("recipe_id", &recipeIDs).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed", "details": err.Error()})
		return
	}
	log.Printf("🥦 Found recipe IDs: %+v\n", recipeIDs)

	// レシピと関連具材をロード（下書きを除外）
	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("id IN ? AND is_draft = ?", recipeIDs, false).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed", "details": err.Error()})
		return
	}
	log.Printf("🥦 Found recipes count: %d\n", len(recipes))

	// 栄養情報の標準値を取得
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		// 標準値が見つからない場合はデフォルト値を設定
		standard = models.NutritionStandard{
			AgeGroup:      "18-29",
			Gender:        "male",
			Calories:      2500,
			Carbohydrates: 300,
			Fat:           70,
			Protein:       60,
			Salt:          8,
		}
	}

	// 検索モードに応じて結果をフィルタリング
	var result []models.Recipe
	switch request.SearchMode {
	case "exact_with_quantity":
		result = h.filterExactWithQuantity(recipes, request.Ingredients, selectedIngredients)
	case "exact_without_quantity":
		result = h.filterExactWithoutQuantity(recipes, request.Ingredients, selectedIngredients)
	case "partial_with_quantity":
		result = h.filterPartialWithQuantity(recipes, request.Ingredients, selectedIngredients)
	case "partial_without_quantity":
		result = h.filterPartialWithoutQuantity(recipes, request.Ingredients, selectedIngredients)
	default:
		// デフォルトは完全一致（数量考慮）
		result = h.filterExactWithQuantity(recipes, request.Ingredients, selectedIngredients)
	}

	// 栄養素の割合を計算
	for i := range result {
		if result[i].Nutrition != (models.NutritionInfo{}) {
			nutritionPercentage := map[string]float64{
				"calories":      (float64(result[i].Nutrition.Calories) / standard.Calories) * 100,
				"carbohydrates": (float64(result[i].Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
				"fat":           (float64(result[i].Nutrition.Fat) / standard.Fat) * 100,
				"protein":       (float64(result[i].Nutrition.Protein) / standard.Protein) * 100,
				"salt":          (float64(result[i].Nutrition.Salt) / standard.Salt) * 100,
			}
			result[i].NutritionPercentage = nutritionPercentage
		}
	}

	log.Printf("🥦 Final result count: %d\n", len(result))
	c.JSON(http.StatusOK, result)
}

// 完全一致（数量考慮）
func (h *RecipeHandler) filterExactWithQuantity(recipes []models.Recipe, requestIngredients []RecipeIngredientRequest, selectedIngredients map[int]float64) []models.Recipe {
	var result []models.Recipe

	for _, recipe := range recipes {
		allIngredientsMatch := true
		missingIngredients := make(map[int]float64)

		selectedIngredientsMap := make(map[int]float64)
		for _, ing := range requestIngredients {
			selectedIngredientsMap[ing.IngredientID] = ing.QuantityRequired
		}

		log.Printf("🥦 Checking recipe %s (ID: %s) - exact with quantity\n", recipe.Name, recipe.ID)

		for _, recipeIng := range recipe.Ingredients {
			log.Printf("🥦 Checking ingredient %s (ID: %d, Unit: %s, Type: %s, Required: %f)\n",
				recipeIng.Ingredient.Name,
				recipeIng.IngredientID,
				recipeIng.Ingredient.Unit.Name,
				recipeIng.Ingredient.Unit.Type,
				recipeIng.QuantityRequired)

			// presence単位の具材は数量チェックをスキップ
			if recipeIng.Ingredient.Unit.Type == "presence" {
				_, exists := selectedIngredientsMap[recipeIng.IngredientID]
				if !exists {
					allIngredientsMatch = false
					missingIngredients[recipeIng.IngredientID] = 1
					log.Printf("🥦 Presence ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
					break
				}
				continue
			}

			// 調味料はスキップ
			if recipeIng.Ingredient.Unit.Name == "適量" ||
				recipeIng.Ingredient.Unit.Name == "少々" ||
				recipeIng.Ingredient.Unit.Name == "ひとつまみ" {
				continue
			}

			// 選択された具材の中に、このレシピの具材が含まれているかチェック
			selectedQuantity, exists := selectedIngredientsMap[recipeIng.IngredientID]
			if !exists {
				allIngredientsMatch = false
				missingIngredients[recipeIng.IngredientID] = recipeIng.QuantityRequired
				log.Printf("🥦 Required ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
				break
			}

			// 数量が十分かチェック
			if selectedQuantity < recipeIng.QuantityRequired {
				allIngredientsMatch = false
				missingIngredients[recipeIng.IngredientID] = recipeIng.QuantityRequired
				log.Printf("🥦 Insufficient quantity for ingredient %d: required %f, selected %f\n",
					recipeIng.IngredientID,
					recipeIng.QuantityRequired,
					selectedQuantity)
				break
			}
		}

		if allIngredientsMatch {
			result = append(result, recipe)
			log.Printf("🥦 Recipe %s (ID: %s) matched all criteria\n", recipe.Name, recipe.ID)
		} else {
			log.Printf("🥦 Recipe %s (ID: %s) did not match. Missing ingredients: %+v\n",
				recipe.Name,
				recipe.ID,
				missingIngredients)
		}
	}

	return result
}

// 完全一致（数量無視）
func (h *RecipeHandler) filterExactWithoutQuantity(recipes []models.Recipe, requestIngredients []RecipeIngredientRequest, selectedIngredients map[int]float64) []models.Recipe {
	var result []models.Recipe

	for _, recipe := range recipes {
		allIngredientsMatch := true
		missingIngredients := make(map[int]float64)

		selectedIngredientsMap := make(map[int]float64)
		for _, ing := range requestIngredients {
			selectedIngredientsMap[ing.IngredientID] = ing.QuantityRequired
		}

		log.Printf("🥦 Checking recipe %s (ID: %s) - exact without quantity\n", recipe.Name, recipe.ID)

		for _, recipeIng := range recipe.Ingredients {
			log.Printf("🥦 Checking ingredient %s (ID: %d, Unit: %s, Type: %s, Required: %f)\n",
				recipeIng.Ingredient.Name,
				recipeIng.IngredientID,
				recipeIng.Ingredient.Unit.Name,
				recipeIng.Ingredient.Unit.Type,
				recipeIng.QuantityRequired)

			// presence単位の具材は数量チェックをスキップ
			if recipeIng.Ingredient.Unit.Type == "presence" {
				_, exists := selectedIngredientsMap[recipeIng.IngredientID]
				if !exists {
					allIngredientsMatch = false
					missingIngredients[recipeIng.IngredientID] = 1
					log.Printf("🥦 Presence ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
					break
				}
				continue
			}

			// 調味料はスキップ
			if recipeIng.Ingredient.Unit.Name == "適量" ||
				recipeIng.Ingredient.Unit.Name == "少々" ||
				recipeIng.Ingredient.Unit.Name == "ひとつまみ" {
				continue
			}

			// 選択された具材の中に、このレシピの具材が含まれているかチェック
			_, exists := selectedIngredientsMap[recipeIng.IngredientID]
			if !exists {
				allIngredientsMatch = false
				missingIngredients[recipeIng.IngredientID] = recipeIng.QuantityRequired
				log.Printf("🥦 Required ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
				break
			}

			// 数量チェックをスキップ
			log.Printf("🥦 Quantity check skipped for ingredient %d due to exact without quantity mode\n", recipeIng.IngredientID)
		}

		if allIngredientsMatch {
			result = append(result, recipe)
			log.Printf("🥦 Recipe %s (ID: %s) matched all criteria\n", recipe.Name, recipe.ID)
		} else {
			log.Printf("🥦 Recipe %s (ID: %s) did not match. Missing ingredients: %+v\n",
				recipe.Name,
				recipe.ID,
				missingIngredients)
		}
	}

	return result
}

// 部分一致（数量考慮）
func (h *RecipeHandler) filterPartialWithQuantity(recipes []models.Recipe, requestIngredients []RecipeIngredientRequest, selectedIngredients map[int]float64) []models.Recipe {
	var result []models.Recipe

	for _, recipe := range recipes {
		selectedIngredientsMap := make(map[int]float64)
		for _, ing := range requestIngredients {
			selectedIngredientsMap[ing.IngredientID] = ing.QuantityRequired
		}

		log.Printf("🥦 Checking recipe %s (ID: %s) - partial with quantity\n", recipe.Name, recipe.ID)

		// レシピの具材のうち、選択された具材と一致するものをカウント
		matchCount := 0
		totalIngredients := 0

		for _, recipeIng := range recipe.Ingredients {
			// 調味料とスパイスはスキップ（部分一致では除外）
			if recipeIng.Ingredient.Genre.ID == 5 || // 調味料
				recipeIng.Ingredient.Genre.ID == 6 { // スパイス
				continue
			}

			// presence単位の具材は数量チェックをスキップ
			if recipeIng.Ingredient.Unit.Type == "presence" {
				totalIngredients++
				_, exists := selectedIngredientsMap[recipeIng.IngredientID]
				if exists {
					matchCount++
					log.Printf("🥦 Presence ingredient %d matched\n", recipeIng.IngredientID)
				}
				continue
			}

			// 調味料系の単位名もスキップ
			if recipeIng.Ingredient.Unit.Name == "適量" ||
				recipeIng.Ingredient.Unit.Name == "少々" ||
				recipeIng.Ingredient.Unit.Name == "ひとつまみ" {
				continue
			}

			totalIngredients++
			selectedQuantity, exists := selectedIngredientsMap[recipeIng.IngredientID]
			if exists {
				// 数量が十分かチェック
				if selectedQuantity >= recipeIng.QuantityRequired {
					matchCount++
					log.Printf("🥦 Ingredient %d matched with sufficient quantity: required %f, selected %f\n",
						recipeIng.IngredientID,
						recipeIng.QuantityRequired,
						selectedQuantity)
				} else {
					log.Printf("🥦 Ingredient %d found but insufficient quantity: required %f, selected %f\n",
						recipeIng.IngredientID,
						recipeIng.QuantityRequired,
						selectedQuantity)
				}
			} else {
				log.Printf("🥦 Ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
			}
		}

		// 少なくとも1つの具材が一致していれば結果に追加
		if matchCount > 0 {
			result = append(result, recipe)
			log.Printf("🥦 Recipe %s (ID: %s) matched %d/%d ingredients\n", recipe.Name, recipe.ID, matchCount, totalIngredients)
		} else {
			log.Printf("🥦 Recipe %s (ID: %s) did not match any ingredients\n", recipe.Name, recipe.ID)
		}
	}

	return result
}

// 部分一致（数量無視）
func (h *RecipeHandler) filterPartialWithoutQuantity(recipes []models.Recipe, requestIngredients []RecipeIngredientRequest, selectedIngredients map[int]float64) []models.Recipe {
	var result []models.Recipe

	for _, recipe := range recipes {
		selectedIngredientsMap := make(map[int]float64)
		for _, ing := range requestIngredients {
			selectedIngredientsMap[ing.IngredientID] = ing.QuantityRequired
		}

		log.Printf("🥦 Checking recipe %s (ID: %s) - partial without quantity\n", recipe.Name, recipe.ID)

		// レシピの具材のうち、選択された具材と一致するものをカウント
		matchCount := 0
		totalIngredients := 0

		for _, recipeIng := range recipe.Ingredients {
			// 調味料とスパイスはスキップ（部分一致では除外）
			if recipeIng.Ingredient.Genre.ID == 5 || // 調味料
				recipeIng.Ingredient.Genre.ID == 6 { // スパイス
				continue
			}

			// presence単位の具材は数量チェックをスキップ
			if recipeIng.Ingredient.Unit.Type == "presence" {
				totalIngredients++
				_, exists := selectedIngredientsMap[recipeIng.IngredientID]
				if exists {
					matchCount++
					log.Printf("🥦 Presence ingredient %d matched\n", recipeIng.IngredientID)
				}
				continue
			}

			// 調味料系の単位名もスキップ
			if recipeIng.Ingredient.Unit.Name == "適量" ||
				recipeIng.Ingredient.Unit.Name == "少々" ||
				recipeIng.Ingredient.Unit.Name == "ひとつまみ" {
				continue
			}

			totalIngredients++
			_, exists := selectedIngredientsMap[recipeIng.IngredientID]
			if exists {
				matchCount++
				log.Printf("🥦 Ingredient %d matched (quantity ignored)\n", recipeIng.IngredientID)
			} else {
				log.Printf("🥦 Ingredient %d not found in selected ingredients\n", recipeIng.IngredientID)
			}
		}

		// 少なくとも1つの具材が一致していれば結果に追加
		if matchCount > 0 {
			result = append(result, recipe)
			log.Printf("🥦 Recipe %s (ID: %s) matched %d/%d ingredients\n", recipe.Name, recipe.ID, matchCount, totalIngredients)
		} else {
			log.Printf("🥦 Recipe %s (ID: %s) did not match any ingredients\n", recipe.Name, recipe.ID)
		}
	}

	return result
}

// SearchRecipesByName handles GET /api/recipes/search
func (h *RecipeHandler) SearchRecipesByName(c *gin.Context) {
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "検索ワードが必要です"})
		return
	}

	// 全レシピを取得（下書きを除外）
	var allRecipes []models.Recipe
	err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Where("is_draft = ?", false).
		Find(&allRecipes).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// 正規化検索でフィルタリング
	var filteredRecipes []models.Recipe
	for _, recipe := range allRecipes {
		if utils.MatchesSearchQuery(query, recipe.Name) {
			filteredRecipes = append(filteredRecipes, recipe)
		}
	}

	// 栄養情報の標準値を取得
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		// 標準値が見つからない場合はデフォルト値を設定
		standard = models.NutritionStandard{
			AgeGroup:      "18-29",
			Gender:        "male",
			Calories:      2500,
			Carbohydrates: 300,
			Fat:           70,
			Protein:       60,
			Salt:          8,
		}
	}

	// 各レシピの栄養素の割合を計算
	for i := range filteredRecipes {
		if filteredRecipes[i].Nutrition != (models.NutritionInfo{}) {
			nutritionPercentage := map[string]float64{
				"calories":      (float64(filteredRecipes[i].Nutrition.Calories) / standard.Calories) * 100,
				"carbohydrates": (float64(filteredRecipes[i].Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
				"fat":           (float64(filteredRecipes[i].Nutrition.Fat) / standard.Fat) * 100,
				"protein":       (float64(filteredRecipes[i].Nutrition.Protein) / standard.Protein) * 100,
				"salt":          (float64(filteredRecipes[i].Nutrition.Salt) / standard.Salt) * 100,
			}
			filteredRecipes[i].NutritionPercentage = nutritionPercentage
		}
	}

	c.JSON(http.StatusOK, filteredRecipes)
}

// GetRecipeByID は特定のレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByID(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recipe ID is required"})
		return
	}

	var recipe models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		First(&recipe, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		return
	}

	// 栄養情報がない場合はデフォルト値を設定
	if recipe.Nutrition == (models.NutritionInfo{}) {
		recipe.Nutrition = models.NutritionInfo{
			Calories:      0,
			Carbohydrates: 0,
			Fat:           0,
			Protein:       0,
			Salt:          0,
		}
	}

	// 推奨摂取量を取得（仮に年齢グループと性別を固定値にしている）
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutrition standard not found"})
		return
	}

	// 栄養素の割合を計算
	nutritionPercentage := map[string]float64{
		"calories":      (float64(recipe.Nutrition.Calories) / standard.Calories) * 100,
		"carbohydrates": (float64(recipe.Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
		"fat":           (float64(recipe.Nutrition.Fat) / standard.Fat) * 100,
		"protein":       (float64(recipe.Nutrition.Protein) / standard.Protein) * 100,
		"salt":          (float64(recipe.Nutrition.Salt) / standard.Salt) * 100,
	}

	// Recipe structのNutritionPercentageフィールドに設定
	recipe.NutritionPercentage = nutritionPercentage

	// JSONレスポンスを返す
	c.JSON(http.StatusOK, gin.H{
		"recipe": recipe,
	})
}

// GetUserRecipes ユーザーが登録したレシピ一覧を取得
func (h *RecipeHandler) GetUserRecipes(c *gin.Context) {
	userIDStr := c.Query("userId") // クエリパラメータから取得
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId"})
		return
	}

	// UUIDに変換
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}

	var recipes []models.Recipe

	// ユーザーのレシピだけを取得
	if err := h.DB.
		Preload("Genre").
		Preload("Ingredients.Ingredient.Unit").
		Where("user_id = ?", userID).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	// 栄養情報の標準値を取得
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutrition standard not found"})
		return
	}

	// 各レシピの栄養素の割合を計算
	for i := range recipes {
		// 栄養情報がない場合はデフォルト値を設定
		if recipes[i].Nutrition == (models.NutritionInfo{}) {
			recipes[i].Nutrition = models.NutritionInfo{
				Calories:      0,
				Carbohydrates: 0,
				Fat:           0,
				Protein:       0,
				Salt:          0,
			}
		}

		// 栄養素の割合を計算
		nutritionPercentage := map[string]float64{
			"calories":      (float64(recipes[i].Nutrition.Calories) / standard.Calories) * 100,
			"carbohydrates": (float64(recipes[i].Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
			"fat":           (float64(recipes[i].Nutrition.Fat) / standard.Fat) * 100,
			"protein":       (float64(recipes[i].Nutrition.Protein) / standard.Protein) * 100,
			"salt":          (float64(recipes[i].Nutrition.Salt) / standard.Salt) * 100,
		}

		// Recipe structのNutritionPercentageフィールドに設定
		recipes[i].NutritionPercentage = nutritionPercentage
	}

	c.JSON(http.StatusOK, gin.H{"recipes": recipes})
}

// GetRecipeByUserID はユーザーIDに基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByUserID(c *gin.Context) {
	userID := c.Param("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("user_id = ?", userID).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// GetRecipeByGenreID はジャンルIDに基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByGenreID(c *gin.Context) {
	genreID := c.Param("genre_id")
	if genreID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre ID is required"})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("genre_id = ?", genreID).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// GetRecipeByIngredientID は具材IDに基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByIngredientID(c *gin.Context) {
	ingredientID := c.Param("ingredient_id")
	if ingredientID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Ingredient ID is required"})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Joins("JOIN recipe_ingredients ON recipes.id = recipe_ingredients.recipe_id").
		Where("recipe_ingredients.ingredient_id = ?", ingredientID).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// GetRecipeByNutrition は栄養素に基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByNutrition(c *gin.Context) {
	var nutrition models.NutritionInfo
	if err := c.ShouldBindJSON(&nutrition); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("nutrition @> ?", nutrition).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// GetRecipeByCookingTime は調理時間に基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByCookingTime(c *gin.Context) {
	cookingTime := c.Param("cooking_time")
	if cookingTime == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cooking time is required"})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("cooking_time <= ?", cookingTime).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// GetRecipeByCostEstimate は費用見積もりに基づいてレシピを取得するハンドラー
func (h *RecipeHandler) GetRecipeByCostEstimate(c *gin.Context) {
	costEstimate := c.Param("cost_estimate")
	if costEstimate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cost estimate is required"})
		return
	}

	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("cost_estimate <= ?", costEstimate).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, recipes)
}
