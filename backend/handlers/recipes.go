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
		IngredientID     int     `json:"ingredientId"`
		QuantityRequired float64 `json:"quantityRequired"`
	}
	var requestIngredients []RecipeIngredientRequest

	// 受信したリクエストボディをログに出力
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("Failed to read request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request body"})
		return
	}
	log.Printf("🔍 Request Body: %s", string(body))

	// JSONデコードを試みる
	if err := json.Unmarshal(body, &requestIngredients); err != nil {
		log.Printf("JSON Unmarshal error: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid JSON format", "details": err.Error()})
		return
	}

	// リクエストの内容をログ出力
	log.Printf("🔍 Request Ingredients:")
	for i, ing := range requestIngredients {
		log.Printf("  [%d] IngredientID: %d, QuantityRequired: %.2f", i, ing.IngredientID, ing.QuantityRequired)
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
	quantityMap := make(map[int]float64)
	for _, ing := range ingredients {
		quantityMap[ing.IngredientID] = ing.QuantityRequired
	}

	// サブクエリ：指定具材が含まれるレシピを取得（下書きを除外）
	subQuery := h.DB.Table("recipe_ingredients").
		Select("recipe_id").
		Where("ingredient_id IN ?", extractIngredientIDs(ingredients)).
		Group("recipe_id")

	// レシピと関連具材をロード（下書きを除外）
	var recipes []models.Recipe
	if err := h.DB.Preload("Ingredients.Ingredient").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Ingredients.Ingredient.Genre").
		Preload("Genre").
		Preload("Reviews").
		Where("id IN (?) AND is_draft = ?", subQuery, false).
		Find(&recipes).Error; err != nil {
		log.Printf("Failed to fetch recipes: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database query failed", "details": err.Error()})
		return
	}

	log.Printf("🔍 Found %d potential recipes", len(recipes))

	// 栄養情報の標準値を取得
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		log.Printf("Failed to fetch nutrition standard: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutrition standard not found"})
		return
	}

	// 結果をフィルタリング
	var result []models.Recipe
	for _, recipe := range recipes {
		// 栄養情報がない場合はデフォルト値を設定
		if recipe.Nutrition == (models.NutritionInfo{}) {
			log.Printf("ℹ️ Recipe %s: No nutrition info, using default values", recipe.Name)
			recipe.Nutrition = models.NutritionInfo{
				Calories:      0,
				Carbohydrates: 0,
				Fat:           0,
				Protein:       0,
				Salt:          0,
			}
		}

		// 栄養素の割合を計算
		nutritionPercentage := map[string]float64{
			"calories":      (float64(recipe.Nutrition.Calories) / standard.Calories) * 100,
			"carbohydrates": (float64(recipe.Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
			"fat":           (float64(recipe.Nutrition.Fat) / standard.Fat) * 100,
			"protein":       (float64(recipe.Nutrition.Protein) / standard.Protein) * 100,
			"salt":          (float64(recipe.Nutrition.Salt) / standard.Salt) * 100,
		}

		meetsRequirements := true

		// レシピの具材を順番にチェック
		for _, recipeIng := range recipe.Ingredients {
			// リクエストされた具材がレシピに含まれていない場合
			if reqQuantity, ok := quantityMap[recipeIng.IngredientID]; ok {
				// 数量が一致しない場合
				if reqQuantity < recipeIng.QuantityRequired {
					log.Printf("⚠️ Recipe %s: Insufficient quantity for ingredient %d (required: %.2f, available: %.2f)",
						recipe.Name, recipeIng.IngredientID, recipeIng.QuantityRequired, reqQuantity)
					meetsRequirements = false
					break
				}
			} else {
				// レシピに必要な具材がリクエストに含まれていない場合
				log.Printf("⚠️ Recipe %s: Missing required ingredient %d",
					recipe.Name, recipeIng.IngredientID)
				meetsRequirements = false
				break
			}
		}

		// 全ての具材が一致した場合にのみレシピを結果に追加
		if meetsRequirements {
			recipe.NutritionPercentage = nutritionPercentage
			result = append(result, recipe)
			log.Printf("✅ Added recipe %s to results", recipe.Name)
		}
	}

	// 結果をログ出力
	log.Printf("🔍 Search Results:")
	for i, recipe := range result {
		log.Printf("  [%d] Recipe: %s", i, recipe.Name)
		log.Printf("     - Genre: %s", recipe.Genre.Name)
		log.Printf("     - Cooking Time: %d minutes", recipe.CookingTime)
		log.Printf("     - Cost Estimate: %d yen", recipe.CostEstimate)
		log.Printf("     - Nutrition: %+v", recipe.Nutrition)
		log.Printf("     - Nutrition Percentage: %+v", recipe.NutritionPercentage)
	}

	// 結果を返す
	if len(result) == 0 {
		log.Printf("⚠️ No recipes found matching the criteria")
		c.JSON(http.StatusOK, []models.Recipe{})
		return
	}

	log.Printf("✅ Returning %d matching recipes", len(result))
	c.JSON(http.StatusOK, result)
}

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
		log.Printf("検索クエリエラー: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "データベースエラー"})
		return
	}

	// 栄養情報の標準値を取得
	var standard models.NutritionStandard
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		log.Printf("Failed to fetch nutrition standard: %v", err)
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
		Preload("Reviews").
		Where("id = ?", id).
		First(&recipe).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
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

	log.Println("👿👿👿👿", userIDStr)
	var recipes []models.Recipe

	// ユーザーのレシピだけを取得
	if err := h.DB.
		Preload("Genre").
		Preload("Ingredients.Ingredient.Unit").
		Where("user_id = ?", userIDStr).
		Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recipes": recipes})
}

// calculateRecipeNutrition は具材からレシピの栄養素を計算する
func calculateRecipeNutrition(ingredients []models.RecipeIngredient) models.NutritionInfo {
	var nutrition models.NutritionInfo

	for _, ing := range ingredients {
		// 具材の栄養素を取得
		ingredientNutrition := ing.Ingredient.Nutrition
		
		// 量に応じて栄養素を按分計算
		ratio := ing.QuantityRequired / 100.0 // 100gあたりの栄養素として計算
		
		nutrition.Calories += ingredientNutrition.Calories * ratio
		nutrition.Protein += ingredientNutrition.Protein * ratio
		nutrition.Fat += ingredientNutrition.Fat * ratio
		nutrition.Carbohydrates += ingredientNutrition.Carbohydrates * ratio
		nutrition.Salt += ingredientNutrition.Salt * ratio
	}

	return nutrition
}
