package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"regexp"
	"strconv"
	"time"

	"portfolio-amarimono/handlers/utils"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB          *gorm.DB
	RedisClient *redis.Client
}

const (
	MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
)

// レシピ名をフォルダ名として使用できる形式に変換
func sanitizeFolderName(name string) string {
	// 正規表現で英数字とハイフン以外を削除
	reg := regexp.MustCompile(`[^a-zA-Z0-9_-]+`)
	return reg.ReplaceAllString(name, "-")
}

// ListIngredients /admin/ingredients(GET) 具材一覧を取得
func (h *AdminHandler) ListIngredients(c *gin.Context) {
	var ingredients []models.Ingredient
	if err := h.DB.Preload("Genre").Preload("Unit").Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}

// AddIngredient /admin/ingredients(POST) 具材を追加
func (h *AdminHandler) AddIngredient(c *gin.Context) {
	// 名前を受け取る
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// 栄養素データを受け取る
	nutritionJSON := c.PostForm("nutrition")
	var nutrition models.NutritionInfo
	if nutritionJSON != "" {
		if err := json.Unmarshal([]byte(nutritionJSON), &nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	// ジャンルIDを受け取る
	genreID := c.PostForm("genre_id")
	if genreID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre ID is required"})
		return
	}

	// ジャンルIDを数値に変換
	genreIDInt, err := strconv.Atoi(genreID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID format"})
		return
	}

	// ジャンルが存在するか確認
	var genre models.IngredientGenre
	if err := h.DB.Where("id = ?", genreIDInt).First(&genre).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
	}

	// 単位IDを受け取る
	unitID := c.PostForm("unit_id")
	if unitID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unit ID is required"})
		return
	}

	// 単位IDを数値に変換
	unitIDInt, err := strconv.Atoi(unitID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit ID format"})
		return
	}

	// 単位が存在するか確認
	var unit models.Unit
	if err := h.DB.Where("id = ?", unitIDInt).First(&unit).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit"})
		return
	}

	// ファイルを受け取る
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// 具材を先に作成してIDを取得
	ingredient := models.Ingredient{
		Name:      name,
		GenreID:   genreIDInt,
		UnitID:    unitIDInt,
		Nutrition: nutrition,
	}

	// 具材名の重複をチェック
	var count int64
	if err := h.DB.Model(&models.Ingredient{}).Where("name = ?", ingredient.Name).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for duplicate ingredient"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材を追加
	if err := h.DB.Create(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
		return
	}

	// 画像を保存
	imagePath, err := utils.SaveImage(c, file, "ingredients", fmt.Sprintf("%d", ingredient.ID))
	if err != nil {
		// 画像の保存に失敗した場合は具材を削除
		h.DB.Delete(&ingredient)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// 画像のパスを更新
	ingredient.ImageUrl = imagePath
	if err := h.DB.Save(&ingredient).Error; err != nil {	
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredient with image path"})
		return
	}

	// ジャンル情報を取得
	var ingredientGenre models.IngredientGenre
	if err := h.DB.Where("id = ?", genreIDInt).First(&ingredientGenre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch genre"})
		return
	}

	// レスポンスにジャンル情報を含める
	ingredient.Genre = ingredientGenre

	c.JSON(http.StatusCreated, gin.H{"message": "Ingredient added successfully", "ingredient": ingredient})
}

func (h *AdminHandler) UpdateIngredient(c *gin.Context) {
	id := c.Param("id")

	var ingredient models.Ingredient
	if err := h.DB.First(&ingredient, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient"})
		}
		return
	}

	// フォームデータの取得
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// 栄養素データを取得
	nutritionJSON := c.PostForm("nutrition")
	var nutrition models.NutritionInfo
	if nutritionJSON != "" {
		if err := json.Unmarshal([]byte(nutritionJSON), &nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	// genre を JSON 文字列として取得し、パース
	genreJSON := c.PostForm("genre")
	var genre struct {
		ID int `json:"id"`
	}
	if err := json.Unmarshal([]byte(genreJSON), &genre); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre format"})
		return
	}

	// unit を JSON 文字列として取得し、パース
	unitJSON := c.PostForm("unit")
	var unit struct {
		ID int `json:"id"`
	}
	if err := json.Unmarshal([]byte(unitJSON), &unit); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit format"})
		return
	}

	// 画像ファイルの処理（選択されていない場合はスキップ）
	file, err := c.FormFile("image")
	if err == nil { // 画像が選択された場合のみ処理
		// SaveImage関数を使用して画像を保存
		imagePath, err := utils.SaveImage(c, file, "ingredients", id)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		// 新しい画像のパスをセット
		ingredient.ImageUrl = imagePath
	} else {
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		if imageUrl != "" {
			ingredient.ImageUrl = imageUrl
		}
	}

	// 具材情報を更新
	ingredient.Name = name
	ingredient.GenreID = genre.ID
	ingredient.UnitID = unit.ID
	if nutritionJSON != "" {
		ingredient.Nutrition = nutrition
	}

	// データベースを更新
	if err := h.DB.Save(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredient"})
		return
	}

	// ジャンル情報を取得してレスポンスに含める
	var ingredientGenre models.IngredientGenre
	if err := h.DB.Where("id = ?", genre.ID).First(&ingredientGenre).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch genre"})
		return
	}
	ingredient.Genre = ingredientGenre

	c.JSON(http.StatusOK, ingredient)
}

// DeleteIngredient /admin/ingredients/:id(DELETE) 具材を削除
func (h *AdminHandler) DeleteIngredient(c *gin.Context) {
	id := c.Param("id")

	// 削除する具材を取得
	var ingredient models.Ingredient
	if err := h.DB.First(&ingredient, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient"})
		}
		return
	}

	// 画像が存在する場合は削除
	if ingredient.ImageUrl != "" {
		if err := utils.DeleteImage(ingredient.ImageUrl); err != nil {
			// 画像の削除に失敗しても具材の削除は続行
		}
	}

	// 具材を削除
	if err := h.DB.Delete(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient deleted successfully"})
}

// ListRecipes /admin/recipes(GET) レシピ一覧を取得
func (h *AdminHandler) ListRecipes(c *gin.Context) {
	var recipes []models.Recipe

	// 生のFAQデータを確認
	var rawFAQData []struct {
		ID  string `gorm:"column:id"`
		FAQ string `gorm:"column:faq"`
	}
	if err := h.DB.Raw("SELECT id, faq FROM recipes").Scan(&rawFAQData).Error; err != nil {
	} else {
	}

	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").Preload("Reviews").Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// AddRecipe /admin/recipes(POST) レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {

	// フォームデータの取得
	form, err := c.MultipartForm()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid form data"})
		return
	}

	// ユーザーIDの取得とログ
	userID := form.Value["user_id"]

	// レシピ名の取得とログ
	name := form.Value["name"]

	// ジャンルIDの取得とログ
	genreID := form.Value["genre_id"]

	// 具材データの取得とログ
	ingredientsJSON := form.Value["ingredients"]

	// 手順データの取得とログ
	instructionsJSON := form.Value["instructions"]

	// 栄養素データの取得とログ
	nutritionJSON := form.Value["nutrition"]

	// FAQデータの取得とログ
	faqJSON := form.Value["faq"]

	// データのパース
	var instructions models.JSONBInstructions
	if len(instructionsJSON) > 0 {
		if err := json.Unmarshal([]byte(instructionsJSON[0]), &instructions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}
	}

	var ingredients []models.RecipeIngredient
	if len(ingredientsJSON) > 0 {
		if err := json.Unmarshal([]byte(ingredientsJSON[0]), &ingredients); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}
	}

	var nutrition models.NutritionInfo
	if len(nutritionJSON) > 0 {
		if err := json.Unmarshal([]byte(nutritionJSON[0]), &nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	var faq models.JSONBFaq
	if len(faqJSON) > 0 {
		if err := json.Unmarshal([]byte(faqJSON[0]), &faq); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid FAQ format"})
			return
		}
	}

	// レシピの作成
	recipe := models.Recipe{
		Name:         name[0],
		GenreID:      parseInt(genreID[0]),
		UserID:       parseUUID(userID[0]),
		IsPublic:     parseBool(form.Value["is_public"][0]),
		IsDraft:      parseBool(form.Value["is_draft"][0]),
		CookingTime:  parseInt(form.Value["cooking_time"][0]),
		CostEstimate: parseInt(form.Value["cost_estimate"][0]),
		Summary:      form.Value["summary"][0],
		Catchphrase:  form.Value["catchphrase"][0],
		Instructions: instructions,
		Ingredients:  ingredients,
		Nutrition:    nutrition,
		FAQ:          faq,
	}

	// トランザクションの開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// データベースへの保存
	if err := tx.Create(&recipe).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recipe"})
		return
	}

	// 画像ファイルの取得とログ
	files := form.File["image"]
	if len(files) > 0 {
		// 画像を保存
		imagePath, err := utils.SaveRecipeImage(c, files[0], recipe.ID.String(), false)
		if err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		recipe.MainImage = imagePath
		if err := tx.Save(&recipe).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe with image path"})
			return
		}
	} else {
	}

	// 手順の画像ファイルの処理
	for i := range instructions {
		fileKey := fmt.Sprintf("instruction_image_%d", i)
		if imageFile, err := c.FormFile(fileKey); err == nil {
			// 画像を保存
			imagePath, err := utils.SaveRecipeImage(c, imageFile, recipe.ID.String(), true)
			if err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
				return
			}
			instructions[i].ImageURL = imagePath
		}
	}

	// 手順データを更新
	recipe.Instructions = instructions
	if err := tx.Save(&recipe).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe with instructions"})
		return
	}

	// トランザクションのコミット
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"recipe": recipe})
}

// ヘルパー関数
func parseInt(s string) int {
	i, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return i
}

func parseUUID(s string) *uuid.UUID {
	id, err := uuid.Parse(s)
	if err != nil {
		return nil
	}
	return &id
}

func parseBool(s string) bool {
	b, err := strconv.ParseBool(s)
	if err != nil {
		return false
	}
	return b
}

// DeleteRecipe はレシピを削除
func (h *AdminHandler) DeleteRecipe(c *gin.Context) {
	// トランザクションを開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to start transaction"})
		return
	}

	// エラーが発生した場合はロールバック
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	recipeID := c.Param("id")

	// レシピの存在確認
	var recipe models.Recipe
	if err := tx.First(&recipe, "id = ?", recipeID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		return
	}

	// メイン画像の削除
	if recipe.MainImage != "" {
		if err := utils.DeleteImage(recipe.MainImage); err != nil {
			// 画像の削除に失敗してもレシピの削除は続行
		}
	}

	// 手順画像の削除
	for _, instruction := range recipe.Instructions {
		if instruction.ImageURL != "" {
			if err := utils.DeleteImage(instruction.ImageURL); err != nil {
				// 画像の削除に失敗してもレシピの削除は続行
			}
		}
	}

	// 関連するrecipe_ingredientsを削除
	if err := tx.Where("recipe_id = ?", recipeID).Delete(&models.RecipeIngredient{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recipe ingredients"})
		return
	}

	// レシピを削除
	if err := tx.Delete(&recipe).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recipe"})
		return
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Recipe deleted successfully"})
}

// UpdateRecipe /admin/recipes/:id(Update) レシピを更新
func (h *AdminHandler) UpdateRecipe(c *gin.Context) {
	id := c.Param("id")
	var recipe models.Recipe

	// 指定されたIDのレシピを取得
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").
		Where("id = ?", id).First(&recipe).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		}
		return
	}

	// フォームデータ取得
	name := c.PostForm("name")
	cookingTime, _ := strconv.Atoi(c.PostForm("cookingTime"))
	costEstimate, _ := strconv.Atoi(c.PostForm("costEstimate"))
	summary := c.PostForm("summary")
	catchphrase := c.PostForm("catchphrase")
	genreID, err := strconv.Atoi(c.PostForm("genre"))
	faqJSON := c.PostForm("faq")
	if err != nil || genreID <= 0 {
		// 下書きの場合はデフォルトのジャンルIDを設定
		genreID = 1
	}

	// is_draftの取得と設定
	isDraft := c.PostForm("is_draft") == "true"
	recipe.IsDraft = isDraft

	// ジャンルが存在するか確認
	var genre models.RecipeGenre
	if err := h.DB.Where("id = ?", genreID).First(&genre).Error; err != nil {
		// 下書きの場合はデフォルトのジャンルを設定
		if err := h.DB.First(&genre).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default genre"})
			return
		}
		genreID = genre.ID
	}

	// 下書きの場合は必須項目のバリデーションをスキップ
	if !isDraft {
		// 必須項目のバリデーション
		if name == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
			return
		}
		if summary == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Summary is required"})
			return
		}
		if catchphrase == "" {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Catchphrase is required"})
			return
		}
	}

	// 画像の保存処理
	if imageFile, err := c.FormFile("image"); err == nil {
		// ファイルサイズチェック
		if imageFile.Size > MAX_FILE_SIZE {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Image file size exceeds 10MB limit"})
			return
		}
		imageURL, err := utils.SaveRecipeImage(c, imageFile, recipe.ID.String(), false)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save main image"})
			return
		}
		recipe.MainImage = imageURL
	}

	// instructions の取得と画像処理
	instructionsJSON := c.PostForm("instructions")
	if instructionsJSON != "" {
		var tempInstructions models.JSONBInstructions
		if err := json.Unmarshal([]byte(instructionsJSON), &tempInstructions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}
		for i := range tempInstructions {
			// 新しい画像ファイルの処理
			fileKey := fmt.Sprintf("instruction_image_%d", i)
			if imageFile, err := c.FormFile(fileKey); err == nil {
				// ファイルサイズチェック
				if imageFile.Size > MAX_FILE_SIZE {
					c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Instruction image %d size exceeds 10MB limit", i)})
					return
				}
				imageURL, err := utils.SaveRecipeImage(c, imageFile, recipe.ID.String(), true)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
					return
				}
				tempInstructions[i].ImageURL = imageURL
			} else {
				// 既存の画像URLの処理
				imageURLKey := fmt.Sprintf("instruction_image_url_%d", i)
				if existingImageURL := c.PostForm(imageURLKey); existingImageURL != "" {
					// SupabaseのURLから相対パスを抽出
					re := regexp.MustCompile(`/storage/v1/object/public/images/(.+)`)
					matches := re.FindStringSubmatch(existingImageURL)
					if len(matches) > 1 {
						tempInstructions[i].ImageURL = matches[1]
					} else {
						// URL形式でない場合はそのまま使用
						tempInstructions[i].ImageURL = existingImageURL
					}
				}
			}
		}
		recipe.Instructions = tempInstructions
	}

	nutritionJSON := c.PostForm("nutrition")
	if nutritionJSON != "" {
		var nutrition models.NutritionInfo
		if err := json.Unmarshal([]byte(nutritionJSON), &nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
		recipe.Nutrition = nutrition
	}

	// 栄養情報の標準値を取得
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

	// トランザクション開始
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// レシピの更新
	updates := make(map[string]interface{})

	// 各フィールドが空でない場合のみ更新対象に追加
	if name != "" {
		updates["name"] = name
	}
	if cookingTime > 0 {
		updates["cooking_time"] = cookingTime
	}
	if costEstimate > 0 {
		updates["cost_estimate"] = costEstimate
	}
	if summary != "" {
		updates["summary"] = summary
	}
	if catchphrase != "" {
		updates["catchphrase"] = catchphrase
	}
	if genreID > 0 {
		updates["genre_id"] = genreID
	}
	if recipe.MainImage != "" {
		updates["image_url"] = recipe.MainImage
	}
	if len(recipe.Instructions) > 0 {
		updates["instructions"] = recipe.Instructions
	}
	// FAQデータの更新
	if faqJSON != "" {
		var faqData models.JSONBFaq
		if err := json.Unmarshal([]byte(faqJSON), &faqData); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid FAQ format"})
			return
		}
		updates["faq"] = faqData
	}
	// Nutritionは常に更新する（空の場合はデフォルト値が設定される）
	updates["nutrition"] = recipe.Nutrition
	updates["is_draft"] = isDraft


	// レシピの更新を実行
	if err := tx.Model(&recipe).Updates(updates).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
		return
	}

	// ingredients の更新
	ingredientsJSON := c.PostForm("ingredients")

	if ingredientsJSON != "" {
		var tempIngredients []TempIngredient

		if err := json.Unmarshal([]byte(ingredientsJSON), &tempIngredients); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}

		// 既存のrecipe_ingredientsを削除
		if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing ingredients"})
			return
		}

		// 新しいrecipe_ingredientsを追加
		var recipeIngredients []models.RecipeIngredient
		for _, temp := range tempIngredients {
			if temp.IngredientID == 0 {
				continue
			}
			recipeIngredients = append(recipeIngredients, models.RecipeIngredient{
				RecipeID:         recipe.ID,
				IngredientID:     temp.IngredientID,
				QuantityRequired: temp.QuantityRequired,
			})
		}

		// 具材データが空でない場合のみ更新を実行
		if len(recipeIngredients) > 0 {
			if err := tx.Create(&recipeIngredients).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredients"})
				return
			}
		}
	}

	// コミット処理
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	// 更新後のレシピデータを取得（新しいトランザクションで）
	var updatedRecipe models.Recipe
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").First(&updatedRecipe, recipe.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated recipe"})
		return
	}

	// 栄養情報の標準値を取得（既存のstandard変数を使用）
	if err := h.DB.Where("age_group = ? AND gender = ?", "18-29", "male").First(&standard).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Nutrition standard not found"})
		return
	}

	// 栄養素の割合を計算
	updatedNutritionPercentage := map[string]float64{
		"calories":      (float64(updatedRecipe.Nutrition.Calories) / standard.Calories) * 100,
		"carbohydrates": (float64(updatedRecipe.Nutrition.Carbohydrates) / standard.Carbohydrates) * 100,
		"fat":           (float64(updatedRecipe.Nutrition.Fat) / standard.Fat) * 100,
		"protein":       (float64(updatedRecipe.Nutrition.Protein) / standard.Protein) * 100,
		"salt":          (float64(updatedRecipe.Nutrition.Salt) / standard.Salt) * 100,
	}

	// 更新後のレシピにNutritionPercentageを設定
	updatedRecipe.NutritionPercentage = updatedNutritionPercentage

	// 更新後のレシピのisDraft値を確認

	c.JSON(http.StatusOK, gin.H{"message": "Recipe updated successfully", "recipe": updatedRecipe})
}

// AddUnit /admin/units (POST) 単位を追加
func (h *AdminHandler) AddUnit(c *gin.Context) {
	// 単位名を受け取る
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// 単位が既に存在するかチェック
	var count int64
	if err := h.DB.Model(&models.Unit{}).Where("name = ?", name).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for duplicate unit"})
		return
	}

	if count > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Unit already exists"})
		return
	}

	// 単位を追加
	unit := models.Unit{Name: name}
	if err := h.DB.Create(&unit).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add unit"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Unit added successfully", "unit": unit})
}

// ListUnits /admin/units (GET) 単位一覧を取得
func (h *AdminHandler) ListUnits(c *gin.Context) {
	var units []models.Unit
	if err := h.DB.Find(&units).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch units"})
		return
	}
	c.JSON(http.StatusOK, units)
}

// SaveDraftRecipe 下書きレシピを保存
func (h *AdminHandler) SaveDraftRecipe(c *gin.Context) {

	// RedisClientのnilチェック
	if h.RedisClient == nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Redis client not initialized"})
		return
	}

	// リクエストボディの内容を確認
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body", "details": err.Error()})
		return
	}

	// リクエストボディを元に戻す（後でShouldBindJSONで使用するため）
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var draftRecipe struct {
		UserID         string                 `json:"userId" binding:"required"`
		RecipeData     map[string]interface{} `json:"recipeData" binding:"required"`
		LastModifiedAt string                 `json:"lastModifiedAt" binding:"required"`
	}

	if err := c.ShouldBindJSON(&draftRecipe); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if draftRecipe.UserID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required"})
		return
	}

	// nutritionデータの存在確認とログ出力
	if nutrition, exists := draftRecipe.RecipeData["nutrition"]; exists {
		// nutritionデータが正しい形式であることを確認
		if nutritionMap, ok := nutrition.(map[string]interface{}); ok {
			requiredFields := []string{"calories", "carbohydrates", "fat", "protein", "salt"}
			for _, field := range requiredFields {
				if _, exists := nutritionMap[field]; !exists {
					// デフォルト値を設定
					nutritionMap[field] = 0
				}
			}
		} else {
			// デフォルトの栄養データを設定
			draftRecipe.RecipeData["nutrition"] = map[string]interface{}{
				"calories":      0,
				"carbohydrates": 0,
				"fat":           0,
				"protein":       0,
				"salt":          0,
			}
		}
	} else {
		// デフォルトの栄養データを設定
		draftRecipe.RecipeData["nutrition"] = map[string]interface{}{
			"calories":      0,
			"carbohydrates": 0,
			"fat":           0,
			"protein":       0,
			"salt":          0,
		}
	}

	// トランザクション開始
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// レシピデータの準備
	recipe := models.Recipe{
		Name:         draftRecipe.RecipeData["name"].(string),
		CookingTime:  int(draftRecipe.RecipeData["cookingTime"].(float64)),
		CostEstimate: int(draftRecipe.RecipeData["costEstimate"].(float64)),
		Summary:      draftRecipe.RecipeData["summary"].(string),
		Catchphrase:  draftRecipe.RecipeData["catchphrase"].(string),
		GenreID:      int(draftRecipe.RecipeData["genre"].(map[string]interface{})["id"].(float64)),
		IsDraft:      true,
		IsPublic:     draftRecipe.RecipeData["isPublic"].(bool),
	}

	// nutritionデータの設定
	if nutrition, ok := draftRecipe.RecipeData["nutrition"].(map[string]interface{}); ok {
		recipe.Nutrition = models.NutritionInfo{
			Calories:      nutrition["calories"].(float64),
			Carbohydrates: nutrition["carbohydrates"].(float64),
			Fat:           nutrition["fat"].(float64),
			Protein:       nutrition["protein"].(float64),
			Salt:          nutrition["salt"].(float64),
		}
	}

	// レシピIDが存在する場合は更新、存在しない場合は新規作成
	if recipeID, exists := draftRecipe.RecipeData["id"].(string); exists && recipeID != "" {

		// 更新用のデータを準備
		updates := map[string]interface{}{
			"name":          recipe.Name,
			"cooking_time":  recipe.CookingTime,
			"cost_estimate": recipe.CostEstimate,
			"summary":       recipe.Summary,
			"catchphrase":   recipe.Catchphrase,
			"genre_id":      recipe.GenreID,
			"is_draft":      recipe.IsDraft,
			"is_public":     recipe.IsPublic,
			"nutrition":     recipe.Nutrition,
		}

		// 既存のレシピを更新
		if err := tx.Model(&models.Recipe{}).Where("id = ?", recipeID).Updates(updates).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
			return
		}

		// 更新後のレシピを取得
		if err := tx.Where("id = ?", recipeID).First(&recipe).Error; err != nil {
			tx.Rollback()	
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated recipe"})
			return
		}
	} else {
		// 新規レシピの作成
		if err := tx.Create(&recipe).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new recipe"})
			return
		}
	}

	// 既存のingredientsを削除
	if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing ingredients"})
		return
	}

	// ingredientsの保存
	if ingredients, ok := draftRecipe.RecipeData["ingredients"].([]interface{}); ok {
		for _, ing := range ingredients {
			ingMap := ing.(map[string]interface{})
			recipeIngredient := models.RecipeIngredient{
				RecipeID:         recipe.ID,
				IngredientID:     int(ingMap["id"].(float64)),
				QuantityRequired: ingMap["quantity_required"].(float64),
			}
			if err := tx.Create(&recipeIngredient).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recipe ingredients"})
				return
			}
		}
	}

	// トランザクションのコミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Redisに保存
	key := fmt.Sprintf("draft_recipe:%s", draftRecipe.UserID)
	jsonData, err := json.Marshal(draftRecipe)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process draft recipe",
			"details": err.Error(),
		})
		return
	}

	// Redisへの保存を試みる
	ctx := context.Background()
	err = h.RedisClient.Set(ctx, key, jsonData, 24*time.Hour).Err()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save draft recipe",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Draft recipe saved successfully", "recipe": recipe})
}

// GetDraftRecipes は下書きレシピを取得するハンドラ
func (h *AdminHandler) GetDraftRecipes(c *gin.Context) {

	// RedisClientのnilチェック
	if h.RedisClient == nil {	
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Redis client not initialized"})
		return
	}

	userId := c.Param("userId")
	if userId == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID is required"})
		return
	}

	// Redisへの接続テスト
	ctx := context.Background()
	if err := h.RedisClient.Ping(ctx).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Redis"})
		return
	}

	// Redisから下書きレシピを取得
	key := fmt.Sprintf("draft_recipe:%s", userId)
	val, err := h.RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		c.JSON(http.StatusOK, gin.H{"draftRecipes": []interface{}{}})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get draft recipes"})
		return
	}

	// JSONをパース
	var draftRecipe struct {
		UserID         string                 `json:"userId"`
		RecipeData     map[string]interface{} `json:"recipeData"`
		LastModifiedAt string                 `json:"lastModifiedAt"`
	}
	if err := json.Unmarshal([]byte(val), &draftRecipe); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse draft recipe"})
		return
	}

	// レスポンスの形式を統一
	response := gin.H{
		"draftRecipes": []interface{}{draftRecipe},
	}
	c.JSON(http.StatusOK, response)
}

// GetRecipe /admin/recipes/:id(GET) レシピを取得
func (h *AdminHandler) GetRecipe(c *gin.Context) {
	id := c.Param("id")

	// UUIDのバリデーション
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID format"})
		return
	}

	var recipe models.Recipe
	if err := h.DB.Preload("Genre").
		Preload("Ingredients.Ingredient.Unit").
		Preload("Reviews").
		Where("id = ?", id).
		First(&recipe).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		}
		return
	}

	// 栄養情報の標準値を取得
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

	c.JSON(http.StatusOK, recipe)
}

type TempIngredient struct {
	IngredientID     int     `json:"ingredient_id"`
	QuantityRequired float64 `json:"quantity_required"`
	UnitID           int     `json:"unit_id"`
}

// UploadImage は画像をアップロードする
func (h *AdminHandler) UploadImage(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ファイルがアップロードされていません"})
		return
	}

	// 一時的なディレクトリに画像を保存
	imageURL, err := utils.SaveImage(c, file, "temp_uploads", "")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "画像の保存に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"url": imageURL})
}

// ToggleRecipePublish レシピの公開/非公開状態を切り替える
func (h *AdminHandler) ToggleRecipePublish(c *gin.Context) {
	id := c.Param("id")

	// UUIDのバリデーション
	if _, err := uuid.Parse(id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid recipe ID format"})
		return
	}

	var recipe models.Recipe
	if err := h.DB.Where("id = ?", id).First(&recipe).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Recipe not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe"})
		}
		return
	}

	// 公開状態を切り替え
	recipe.IsPublic = !recipe.IsPublic

	// 更新を保存
	if err := h.DB.Save(&recipe).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Recipe publish status updated successfully",
		"recipe":  recipe,
	})
}
