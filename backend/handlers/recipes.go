package handlers

import (
	"encoding/json"
	"io"
	"log"
	"net/http"

	"portfolio-amarimono/models"

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

func extractIngredientIDs(ingredients []models.RecipeIngredient) []int {
	var ids []int
	for _, ing := range ingredients {
		ids = append(ids, ing.IngredientID)
	}
	return ids
}

// SerchRecipes handles POST /api/recipes
func (h *RecipeHandler) SerchRecipes(c *gin.Context) {
	type RecipeIngredientRequest struct {
		IngredientID     int `json:"ingredientId"`
		QuantityRequired int `json:"quantityRequired"`
	}
	var requestIngredients []RecipeIngredientRequest

	// 受信したリクエストボディをログに出力
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	log.Printf("Request Body: %s", string(body))

	// JSONデコードを試みる
	if err := json.Unmarshal(body, &requestIngredients); err != nil {
		log.Printf("JSON Unmarshal error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		return
	}

	// `RecipeIngredient` に変換
	var ingredients []models.RecipeIngredient
	for _, req := range requestIngredients {
		ingredients = append(ingredients, models.RecipeIngredient{
			IngredientID:     req.IngredientID,
			QuantityRequired: req.QuantityRequired,
		})
	}

	// マップで数量を管理
	quantityMap := make(map[int]int)
	for _, ing := range ingredients {
		quantityMap[ing.IngredientID] = ing.QuantityRequired
	}

	// サブクエリ：すべての指定具材が含まれるレシピを取得
	subQuery := h.DB.Table("recipe_ingredients").
		Select("recipe_id").
		Where("ingredient_id IN ?", extractIngredientIDs(ingredients)).
		Group("recipe_id").
		Having("COUNT(recipe_id) = ?", len(ingredients))

	// レシピと関連具材をロード
	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Where("id IN (?)", subQuery).
		Find(&recipes).Error; err != nil {
		log.Printf("Failed to fetch recipes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed", "details": err.Error()})
		return
	}

	// 結果をフィルタリング
	var result []models.Recipe
	for _, recipe := range recipes {
		allIngredientsMatch := true
		var matchedIngredients []models.RecipeIngredient

		// レシピの具材を順番にチェック
		for _, recipeIng := range recipe.Ingredients {
			// リクエストされた具材がレシピに含まれていない場合
			if reqQuantity, ok := quantityMap[recipeIng.IngredientID]; ok {
				// 数量が一致しない場合
				if reqQuantity < recipeIng.QuantityRequired {
					allIngredientsMatch = false
					break
				}
				// 一致する具材をマッチングリストに追加
				matchedIngredients = append(matchedIngredients, recipeIng)
			} else {
				// レシピに必要な具材がリクエストに含まれていない場合
				allIngredientsMatch = false
				break
			}
		}

		// 全ての具材が一致した場合にのみレシピを結果に追加
		if allIngredientsMatch {
			result = append(result, recipe)
		}
	}

	// 結果を返す
	if len(result) == 0 {
		c.JSON(http.StatusOK, []models.Recipe{})
		return
	}

	c.JSON(http.StatusOK, result)
}

// GetRecipeByID /api/recipes/:id (GET) レシピをIDで取得
func (h *RecipeHandler) GetRecipeByID(c *gin.Context) {
	idStr := c.Param("id")
	// UUIDに変換
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID"})
		return
	}

	var recipe models.Recipe
	if err := h.DB.
		Preload("Genre").
		Preload("Ingredients.Ingredient.Unit").
		Where("id = ?", id).
		First(&recipe).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		return
	}

	// 栄養情報がない場合
	if recipe.Nutrition == (models.NutritionInfo{}) {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutrition data not found for this recipe"})
		return
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
		"sugar":         (float64(recipe.Nutrition.Sugar) / standard.Sugar) * 100,
	}

	log.Println("✅✅✅", recipe)

	log.Println("✅✅✅", nutritionPercentage)

	// JSONレスポンスを返す
	c.JSON(http.StatusOK, gin.H{
		"recipe":          recipe,
		"nutrition_ratio": nutritionPercentage,
	})
}

// GetUserRecipes ユーザーが登録したレシピ一覧を取得
func (h *RecipeHandler) GetUserRecipes(c *gin.Context) {
	userIDStr := c.Query("userId") // クエリパラメータから取得
	log.Println("😇😇😇", userIDStr)
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Missing userId"})
		return
	}

	var recipes []models.Recipe

	// ユーザーのレシピだけを取得
	if err := h.DB.Where("user_id = ?", userIDStr).Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recipes": recipes})
}
