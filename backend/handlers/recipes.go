package handlers

import (
	"encoding/json"
	"io"
	"net/http"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
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
type SearchRequest []RecipeIngredientRequest

// SerchRecipes handles POST /api/recipes
func (h *RecipeHandler) SerchRecipes(c *gin.Context) {
	var request SearchRequest

	// 受信したリクエストボディをログに出力
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {	
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}

	// JSONデコードを試みる
	if err := json.Unmarshal(body, &request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		return
	}

	// 選択された具材のマップを作成（IDをキーとして、数量を値として）
	selectedIngredients := make(map[int]float64)
	var ingredientIDs []int
	for _, ing := range request {
		selectedIngredients[ing.IngredientID] = ing.QuantityRequired
		ingredientIDs = append(ingredientIDs, ing.IngredientID)
	}

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

	// 結果をフィルタリング
	var result []models.Recipe
	for _, recipe := range recipes {
		// レシピの具材をチェック
		allIngredientsMatch := true
		missingIngredients := make(map[int]float64)

		// 選択された具材のマップを作成（調味料を除く）
		selectedIngredientsMap := make(map[int]float64)
		for _, ing := range request {
			selectedIngredientsMap[ing.IngredientID] = ing.QuantityRequired
		}

		// レシピの各具材をチェック
		for _, recipeIng := range recipe.Ingredients {
			// presence単位またはseasoning単位の具材はスキップ
			if recipeIng.Ingredient.Unit.Name == "presence" ||
				recipeIng.Ingredient.Unit.Name == "適量" ||
				recipeIng.Ingredient.Unit.Name == "少々" ||
				recipeIng.Ingredient.Unit.Name == "ひとつまみ" {	
				continue
			}

			// 選択された具材の中に、このレシピの具材が含まれているかチェック
			selectedQuantity, exists := selectedIngredientsMap[recipeIng.IngredientID]
			if !exists {
				allIngredientsMatch = false
				missingIngredients[recipeIng.IngredientID] = recipeIng.QuantityRequired
				break
			}

			// 数量が十分かチェック
			if selectedQuantity < recipeIng.QuantityRequired {
				allIngredientsMatch = false
				missingIngredients[recipeIng.IngredientID] = recipeIng.QuantityRequired
				break
			}

		}

		// 全ての具材が一致し、かつ数量が十分な場合のみ結果に追加
		if allIngredientsMatch {
			result = append(result, recipe)
		}
	}

	c.JSON(http.StatusOK, result)
}

// SearchRecipesByName handles GET /api/recipes/search
func (h *RecipeHandler) SearchRecipesByName(c *gin.Context) {
	query := c.Query("q")

	if query == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "検索ワードが必要です"})
		return
	}

	var recipes []models.Recipe
	err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Where("LOWER(name) LIKE LOWER(?) AND is_draft = ?", "%"+query+"%", false).
		Order(clause.Expr{SQL: "POSITION(LOWER(?) IN LOWER(name))", Vars: []interface{}{query}}).
		Find(&recipes).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
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
		if recipes[i].Nutrition != (models.NutritionInfo{}) {
			nutritionPercentage := map[string]float64{
				"calories":      (float64(recipes[i].Nutrition.Calories) / standard.Calories) * 100,
				"carbohydrates": (float64(recipes[i].Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
				"fat":           (float64(recipes[i].Nutrition.Fat) / standard.Fat) * 100,
				"protein":       (float64(recipes[i].Nutrition.Protein) / standard.Protein) * 100,
				"salt":          (float64(recipes[i].Nutrition.Salt) / standard.Salt) * 100,
			}
			recipes[i].NutritionPercentage = nutritionPercentage
		}
	}

	c.JSON(http.StatusOK, recipes)
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

// UpdateRecipe はレシピを更新するハンドラー
func (h *RecipeHandler) UpdateRecipe(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recipe ID is required"})
		return
	}

	var recipe models.Recipe
	if err := c.ShouldBindJSON(&recipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if err := h.DB.Model(&models.Recipe{}).Where("id = ?", id).Updates(recipe).Error; err != nil {	
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
		return
	}

	c.JSON(http.StatusOK, recipe)
}

// DeleteRecipe はレシピを削除するハンドラー
func (h *RecipeHandler) DeleteRecipe(c *gin.Context) {
	id := c.Param("id")
	if id == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Recipe ID is required"})
		return
	}

	if err := h.DB.Delete(&models.Recipe{}, "id = ?", id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recipe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recipe deleted successfully"})
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
