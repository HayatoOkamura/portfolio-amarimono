package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
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
	log.Println("⭐️=== AddIngredient Handler Start ===")
	// 名前を受け取る
	name := c.PostForm("name")
	if name == "" {
		log.Println("Error: Name is missing")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// ジャンルIDを受け取る
	genreID := c.PostForm("genre_id")
	if genreID == "" {
		log.Println("Error: Genre ID is missing")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre ID is required"})
		return
	}

	// ジャンルIDを数値に変換
	genreIDInt, err := strconv.Atoi(genreID)
	if err != nil {
		log.Println("Error: Invalid genre ID format")
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID format"})
		return
	}

	// ジャンルが存在するか確認
	var genre models.IngredientGenre
	if err := h.DB.Where("id = ?", genreIDInt).First(&genre).Error; err != nil {
		log.Println("Error: Genre not found:", err)
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
		log.Println("Error: Image file is missing:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// ファイルを保存するディレクトリ
	saveDir := filepath.Join(".", "uploads", "recipe")
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		log.Println("Uploads directory does not exist, creating it...")
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			log.Println("Error creating uploads directory:", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}
	}

	// ファイルを保存
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		log.Println("Error saving uploaded file:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	ingredient := models.Ingredient{
		Name:     name,
		GenreID:  genreIDInt,
		UnitID:   uint(unitIDInt),
		ImageUrl: savePath,
		Quantity: 0,
	}

	// 具材名の重複をチェック
	var count int64
	if err := h.DB.Model(&models.Ingredient{}).Where("name = ?", ingredient.Name).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for duplicate ingredient"})
		return
	}

	if count > 0 {
		log.Println("Error: Ingredient already exists")
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材を追加
	if err := h.DB.Create(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
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

	log.Println("Ingredient added successfully:", ingredient)
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
		saveDir := "./uploads"
		if _, err := os.Stat(saveDir); os.IsNotExist(err) {
			os.MkdirAll(saveDir, os.ModePerm)
		}
		uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
		savePath := filepath.Join(saveDir, uniqueFilename)
		if err := c.SaveUploadedFile(file, savePath); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		// 新しい画像のパスをセット
		ingredient.ImageUrl = savePath
	}

	// 具材情報を更新
	ingredient.Name = name
	ingredient.GenreID = genre.ID
	ingredient.UnitID = uint(unit.ID)

	// データベースを更新
	if err := h.DB.Save(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredient"})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// DELETE /admin/ingredients/:id(DELETE) 具材を削除
func (h *AdminHandler) DeleteIngredient(c *gin.Context) {
	id := c.Param("id")

	// 具材情報を取得して画像のパスを取得
	var ingredient models.Ingredient
	if err := h.DB.Table("ingredients").First(&ingredient, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient"})
		}
		return
	}

	// 具材を使用しているレシピを削除
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// 1. 該当する ingredient_id を持つ recipe_id を中間テーブルから取得
		var recipeIDs []string
		if err := tx.Table("recipe_ingredients").
			Select("recipe_id").
			Where("ingredient_id = ?", id).
			Where("recipe_id IS NOT NULL").
			Find(&recipeIDs).Error; err != nil {
			log.Println("Error finding recipe IDs associated with ingredient ID:", err)
			return err
		}

		// 2. 中間テーブルから該当の ingredient_id のデータを削除
		if err := tx.Table("recipe_ingredients").
			Where("ingredient_id = ?", id).
			Delete(nil).Error; err != nil {
			log.Println("Error deleting recipe ingredients:", err)
			return err
		} else {
			log.Println("Deleted recipe_ingredients for ingredient ID:", id)
		}

		// 3. 該当する recipe_id のレシピを削除
		if len(recipeIDs) > 0 {
			if err := tx.Table("recipes").
				Where("id IN ?", recipeIDs).
				Delete(nil).Error; err != nil {
				log.Println("Error deleting recipes associated with ingredient ID:", id)
				return err
			}
			log.Println("Deleted recipes associated with ingredient ID:", id)
		}

		// 4. 最後に具材を削除
		if err := tx.Delete(&models.Ingredient{}, id).Error; err != nil {
			log.Println("Error deleting ingredient:", err)
			return err
		} else {
			log.Println("Deleted ingredient ID:", id)
		}

		return nil
	})

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient and associated recipes"})
		return
	}

	// パス設定: Docker プロジェクトの "backend/uploads" ディレクトリを基準
	uploadDir := filepath.Join(".", "backend", "uploads")
	imagePath := filepath.Join(uploadDir, filepath.Base(ingredient.ImageUrl))

	// 対応する画像ファイルを削除
	if err := os.Remove(imagePath); err != nil {
		// 画像削除の失敗をログに記録し、処理は続行
		log.Println("Error removing image file:", err)
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
		log.Printf("❌ Error fetching raw FAQ data: %v", err)
	} else {
		for _, data := range rawFAQData {
			log.Printf("📝 Recipe ID: %s, Raw FAQ data: %s", data.ID, data.FAQ)
		}
	}

	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").Preload("Reviews").Find(&recipes).Error; err != nil {
		log.Printf("❌ Error fetching recipes: %v", err)
		log.Printf("❌ Error details: %+v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// AddRecipe /admin/recipes(POST) レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {
	log.Println("=== AddRecipe Handler Start ===")

	// フォームデータの取得
	name := c.PostForm("name")
	isDraftStr := c.PostForm("is_draft")
	userId := c.PostForm("user_id")
	isAdmin := c.PostForm("is_admin")
	cookingTime := c.PostForm("cooking_time")
	costEstimate := c.PostForm("cost_estimate")
	genre := c.PostForm("genre")
	summary := c.PostForm("summary")
	catchphrase := c.PostForm("catchphrase")
	nutrition := c.PostForm("nutrition")
	ingredients := c.PostForm("ingredients")
	instructions := c.PostForm("instructions")

	// デバッグログ
	log.Printf("Form data received:")
	log.Printf("name: %s", name)
	log.Printf("is_draft: %s", isDraftStr)
	log.Printf("user_id: %s", userId)
	log.Printf("is_admin: %s", isAdmin)
	log.Printf("cooking_time: %s", cookingTime)
	log.Printf("cost_estimate: %s", costEstimate)
	log.Printf("genre: %s", genre)
	log.Printf("summary: %s", summary)
	log.Printf("catchphrase: %s", catchphrase)
	log.Printf("nutrition: %s", nutrition)
	log.Printf("ingredients: %s", ingredients)
	log.Printf("instructions: %s", instructions)

	// 画像ファイルの確認
	for i := 0; i < 10; i++ { // 最大10個の画像を確認
		fileKey := fmt.Sprintf("instruction_image_%d", i)
		if file, err := c.FormFile(fileKey); err == nil {
			log.Printf("Found image file for instruction %d: %s", i, file.Filename)
		}
	}

	// 下書きフラグの確認
	isDraft := isDraftStr == "true"
	log.Printf("Is draft: %v", isDraft)

	// トランザクション開始
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// 下書きの場合は最小限のバリデーション
	if isDraft {
		log.Println("Processing draft recipe")
		// レシピ名の確認
		if name == "" {
			log.Println("Missing recipe name for draft")
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Recipe name is required"})
			return
		}

		// デフォルト値の設定
		if cookingTime == "" {
			cookingTime = "0"
		}
		if costEstimate == "" {
			costEstimate = "0"
		}
		if genre == "" || genre == "0" {
			genre = "1" // デフォルトのジャンルIDを1に設定
		}
		if nutrition == "" {
			nutrition = `{"calories":0,"carbohydrates":0,"fat":0,"protein":0,"sugar":0,"salt":0}`
		}
		if ingredients == "" {
			ingredients = "[]"
		}
		if instructions == "" {
			instructions = "[]"
		}
	} else {
		log.Println("Processing full recipe")
		// 通常のレシピのバリデーション
		if cookingTime == "" {
			log.Println("Missing cooking time")
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cooking time"})
			return
		}
		// ジャンルIDのバリデーション
		if genre == "" || genre == "0" {
			log.Println("Invalid genre ID")
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
			return
		}
	}

	// ジャンルIDの存在確認
	genreID := getIntFromString(genre)
	var genreExists bool
	if err := tx.Model(&models.RecipeGenre{}).Select("count(*) > 0").Where("id = ?", genreID).Find(&genreExists).Error; err != nil {
		log.Printf("Error checking genre existence: %v", err)
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to validate genre"})
		return
	}
	if !genreExists {
		log.Printf("Genre ID %d does not exist", genreID)
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
		return
	}

	// レシピの作成処理
	recipe := models.Recipe{
		Name:         name,
		IsDraft:      isDraft,
		CookingTime:  getIntFromString(cookingTime),
		CostEstimate: getIntFromString(costEstimate),
		GenreID:      genreID,
		Summary:      summary,
		Catchphrase:  catchphrase,
	}

	// メイン画像の処理
	if imageFile, err := c.FormFile("image"); err == nil {
		imageURL, err := utils.SaveImage(c, imageFile, "recipe")
		if err != nil {
			log.Printf("Error saving main image: %v", err)
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save main image"})
			return
		}
		recipe.ImageUrl = imageURL
	}

	// ユーザーIDの設定
	if userId != "" {
		userID, err := uuid.Parse(userId)
		if err == nil {
			recipe.UserID = &userID
		}
	}

	// 栄養情報の設定
	if nutrition != "" {
		if err := json.Unmarshal([]byte(nutrition), &recipe.Nutrition); err != nil {
			log.Printf("Error parsing nutrition data: %v", err)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	// レシピの保存
	if err := tx.Create(&recipe).Error; err != nil {
		log.Printf("Error creating recipe: %v", err)
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create recipe"})
		return
	}

	// 材料の処理
	log.Printf("Raw ingredients data: %s", ingredients)
	log.Printf("Processing ingredients: %s", ingredients)
	var ingredientsData []struct {
		IngredientID     int `json:"ingredient_id"`
		QuantityRequired int `json:"quantity_required"`
		UnitID           int `json:"unit_id"`
	}
	if err := json.Unmarshal([]byte(ingredients), &ingredientsData); err != nil {
		log.Printf("Error parsing ingredients JSON: %v", err)
		log.Printf("Raw JSON data that failed to parse: %s", ingredients)
		tx.Rollback()
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients data"})
		return
	}
	log.Printf("Parsed ingredients: %+v", ingredientsData)

	// 材料の存在確認
	for _, ing := range ingredientsData {
		if ing.IngredientID == 0 {
			log.Printf("Invalid ingredient ID: %d", ing.IngredientID)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredient ID"})
			return
		}
		var ingredient models.Ingredient
		if err := tx.First(&ingredient, ing.IngredientID).Error; err != nil {
			log.Printf("Ingredient not found: %d, error: %v", ing.IngredientID, err)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Ingredient not found"})
			return
		}
	}

	// 材料の保存
	var recipeIngredients []models.RecipeIngredient
	for _, temp := range ingredientsData {
		// ingredient_idが0の場合はスキップ
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

	// 手順の処理
	if instructions != "" {
		var tempInstructions models.JSONBInstructions
		if err := json.Unmarshal([]byte(instructions), &tempInstructions); err != nil {
			log.Printf("Error parsing instructions: %v", err)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}

		// 手順の画像を処理
		for i, instruction := range tempInstructions {
			if imageFile, err := c.FormFile(fmt.Sprintf("instruction_image_%d", i)); err == nil {
				imageURL, err := utils.SaveImage(c, imageFile, "instruction")
				if err != nil {
					log.Printf("Error saving instruction image: %v", err)
					tx.Rollback()
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
					return
				}
				instruction.ImageURL = imageURL
				tempInstructions[i] = instruction
			}
		}

		recipe.Instructions = tempInstructions

		if err := tx.Model(&recipe).Update("instructions", tempInstructions).Error; err != nil {
			log.Printf("Error updating instructions: %v", err)
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instructions"})
			return
		}
	}

	// トランザクションのコミット
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recipe"})
		return
	}

	// 保存したレシピの取得（関連データを含む）
	var savedRecipe models.Recipe
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").First(&savedRecipe, recipe.ID).Error; err != nil {
		log.Printf("Error fetching saved recipe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Recipe saved but failed to fetch details"})
		return
	}

	c.JSON(http.StatusCreated, savedRecipe)
}

// ヘルパー関数
func getIntFromString(s string) int {
	if s == "" {
		return 0
	}
	val, err := strconv.Atoi(s)
	if err != nil {
		return 0
	}
	return val
}

// DeleteRecipe /admin/recipes/:id(DELETE) レシピを削除
func (h *AdminHandler) DeleteRecipe(c *gin.Context) {
	id := c.Param("id")

	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// レシピに関連する具材を削除
		if err := tx.Table("recipe_ingredients").Where("recipe_id = ?", id).Delete(nil).Error; err != nil {
			log.Println("Error deleting recipe ingredients:", err)
			return err
		}

		// レシピ本体を削除
		if err := tx.Table("recipes").Where("id = ?", id).Delete(nil).Error; err != nil {
			log.Println("Error deleting recipe:", err)
			return err
		}
		return nil
	})

	if err != nil {
		log.Println("Transaction failed:", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete recipe"})
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

	// フォルダ名を作成
	recipeFolder := sanitizeFolderName(recipe.Name)

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
	log.Printf("📝 Received is_draft value: %v", c.PostForm("is_draft"))
	log.Printf("📝 Parsed isDraft value: %v", isDraft)
	log.Printf("📝 isDraft is false: %v", !isDraft)
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
		imageURL, err := utils.SaveImage(c, imageFile, recipeFolder)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save main image"})
			return
		}
		recipe.ImageUrl = filepath.ToSlash(filepath.Join(recipeFolder, filepath.Base(imageURL)))
	}

	// instructions の取得と画像処理
	instructionsJSON := c.PostForm("instructions")
	if instructionsJSON != "" {
		var tempInstructions models.JSONBInstructions
		if err := json.Unmarshal([]byte(instructionsJSON), &tempInstructions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}
		log.Printf("📝 Processing instructions: %+v", tempInstructions)
		for i := range tempInstructions {
			// 新しい画像ファイルの処理
			fileKey := fmt.Sprintf("instruction_image_%d", i)
			if imageFile, err := c.FormFile(fileKey); err == nil {
				log.Printf("📝 Found new image file for instruction %d: %s", i, imageFile.Filename)
				savePath := filepath.Join(recipeFolder, "instructions")
				imageURL, err := utils.SaveImage(c, imageFile, savePath)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
					return
				}
				log.Printf("📝 Saved new image for instruction %d: %s", i, imageURL)
				tempInstructions[i].ImageURL = filepath.ToSlash(filepath.Join(recipeFolder, "instructions", filepath.Base(imageURL)))
			} else {
				// 既存の画像URLの処理
				imageURLKey := fmt.Sprintf("instruction_image_url_%d", i)
				if existingImageURL := c.PostForm(imageURLKey); existingImageURL != "" {
					log.Printf("📝 Processing existing image URL for instruction %d: %s", i, existingImageURL)
					// 正規表現で完全なURLから相対パスを抽出
					re := regexp.MustCompile(`http://[^/]+/uploads/(.+)`)
					matches := re.FindStringSubmatch(existingImageURL)
					if len(matches) > 1 {
						tempInstructions[i].ImageURL = matches[1]
						log.Printf("📝 Extracted relative path: %s", matches[1])
					} else {
						// URL形式でない場合はそのまま使用
						tempInstructions[i].ImageURL = existingImageURL
						log.Printf("📝 Using original URL: %s", existingImageURL)
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
	if recipe.ImageUrl != "" {
		updates["image_url"] = recipe.ImageUrl
	}
	if len(recipe.Instructions) > 0 {
		updates["instructions"] = recipe.Instructions
	}
	// FAQデータの更新
	if faqJSON != "" {
		var faqData models.JSONBFaq
		if err := json.Unmarshal([]byte(faqJSON), &faqData); err != nil {
			log.Printf("❌ Error parsing FAQ data: %v", err)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid FAQ format"})
			return
		}
		updates["faq"] = faqData
	}
	// Nutritionは常に更新する（空の場合はデフォルト値が設定される）
	updates["nutrition"] = recipe.Nutrition
	updates["is_draft"] = isDraft

	log.Printf("📝 Updates map: %+v", updates)

	// レシピの更新を実行
	if err := tx.Model(&recipe).Updates(updates).Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Error updating recipe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
		return
	}

	// ingredients の更新
	ingredientsJSON := c.PostForm("ingredients")
	log.Printf("📝 Raw ingredients JSON from request: %s", ingredientsJSON)
	log.Printf("📝 Request form data: %+v", c.Request.PostForm)
	log.Printf("📝 Request content type: %s", c.Request.Header.Get("Content-Type"))
	log.Printf("📝 Request body size: %d", c.Request.ContentLength)

	if ingredientsJSON != "" {
		var tempIngredients []struct {
			IngredientID     int `json:"ingredient_id"`
			QuantityRequired int `json:"quantity_required"`
			UnitID           int `json:"unit_id"`
		}

		log.Printf("📝 Attempting to parse ingredients JSON...")
		log.Printf("📝 Raw JSON string: %s", ingredientsJSON)
		if err := json.Unmarshal([]byte(ingredientsJSON), &tempIngredients); err != nil {
			log.Printf("❌ Error parsing ingredients JSON: %v", err)
			log.Printf("❌ Raw ingredients JSON: %s", ingredientsJSON)
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}

		log.Printf("📝 Successfully parsed ingredients: %+v", tempIngredients)
		log.Printf("📝 Number of ingredients: %d", len(tempIngredients))

		// 既存のingredientsを削除
		log.Printf("📝 Deleting existing ingredients for recipe ID: %s", recipe.ID)
		if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{}).Error; err != nil {
			log.Printf("❌ Error deleting existing ingredients: %v", err)
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing ingredients"})
			return
		}
		log.Printf("📝 Successfully deleted existing ingredients")

		// 新しいingredientsを追加
		var recipeIngredients []models.RecipeIngredient
		for i, temp := range tempIngredients {
			// ingredient_idが0の場合はスキップ
			if temp.IngredientID == 0 {
				log.Printf("⚠️ Skipping ingredient %d with ID 0", i)
				continue
			}
			log.Printf("📝 Processing ingredient %d: ID=%d, Quantity=%d, UnitID=%d",
				i, temp.IngredientID, temp.QuantityRequired, temp.UnitID)
			recipeIngredients = append(recipeIngredients, models.RecipeIngredient{
				RecipeID:         recipe.ID,
				IngredientID:     temp.IngredientID,
				QuantityRequired: temp.QuantityRequired,
			})
		}

		// 具材データが空でない場合のみ更新を実行
		if len(recipeIngredients) > 0 {
			log.Printf("📝 Creating %d recipe ingredients: %+v", len(recipeIngredients), recipeIngredients)
			if err := tx.Create(&recipeIngredients).Error; err != nil {
				log.Printf("❌ Error creating recipe ingredients: %v", err)
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredients"})
				return
			}
			log.Printf("📝 Successfully created recipe ingredients")
		} else {
			log.Printf("⚠️ No valid ingredients to create")
		}
	} else {
		log.Printf("⚠️ No ingredients JSON provided")
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

	// 更新後のレシピのisDraft値を確認
	log.Printf("📝 Final recipe isDraft value: %v", updatedRecipe.IsDraft)
	log.Printf("📝 Updated recipe: %+v", updatedRecipe)

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
	log.Println("🔥 Starting SaveDraftRecipe")

	// RedisClientのnilチェック
	if h.RedisClient == nil {
		log.Println("❌ Redis client is not initialized")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Redis client not initialized"})
		return
	}

	// リクエストボディの内容を確認
	body, err := io.ReadAll(c.Request.Body)
	if err != nil {
		log.Printf("❌ Error reading request body: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read request body", "details": err.Error()})
		return
	}
	log.Printf("📦 Raw request body: %s", string(body))

	// リクエストボディを元に戻す（後でShouldBindJSONで使用するため）
	c.Request.Body = io.NopCloser(bytes.NewBuffer(body))

	var draftRecipe struct {
		UserID         string                 `json:"userId" binding:"required"`
		RecipeData     map[string]interface{} `json:"recipeData" binding:"required"`
		LastModifiedAt string                 `json:"lastModifiedAt" binding:"required"`
	}

	if err := c.ShouldBindJSON(&draftRecipe); err != nil {
		log.Printf("❌ Error binding JSON: %v", err)
		log.Printf("❌ Request headers: %+v", c.Request.Header)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	if draftRecipe.UserID == "" {
		log.Println("❌ UserID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "UserID is required"})
		return
	}

	// nutritionデータの存在確認とログ出力
	if nutrition, exists := draftRecipe.RecipeData["nutrition"]; exists {
		log.Printf("📊 Nutrition data found: %+v", nutrition)
		// nutritionデータが正しい形式であることを確認
		if nutritionMap, ok := nutrition.(map[string]interface{}); ok {
			requiredFields := []string{"calories", "carbohydrates", "fat", "protein", "sugar", "salt"}
			for _, field := range requiredFields {
				if _, exists := nutritionMap[field]; !exists {
					log.Printf("⚠️ Missing required nutrition field: %s", field)
					// デフォルト値を設定
					nutritionMap[field] = 0
				}
			}
		} else {
			log.Printf("⚠️ Nutrition data is not in the expected format: %+v", nutrition)
			// デフォルトの栄養データを設定
			draftRecipe.RecipeData["nutrition"] = map[string]interface{}{
				"calories":      0,
				"carbohydrates": 0,
				"fat":           0,
				"protein":       0,
				"sugar":         0,
				"salt":          0,
			}
		}
	} else {
		log.Println("⚠️ No nutrition data found in recipe data")
		// デフォルトの栄養データを設定
		draftRecipe.RecipeData["nutrition"] = map[string]interface{}{
			"calories":      0,
			"carbohydrates": 0,
			"fat":           0,
			"protein":       0,
			"sugar":         0,
			"salt":          0,
		}
	}

	log.Printf("✅ Processed draft recipe: %+v", draftRecipe)

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
			Sugar:         nutrition["sugar"].(float64),
			Salt:          nutrition["salt"].(float64),
		}
	}

	// レシピIDが存在する場合は更新、存在しない場合は新規作成
	if recipeID, exists := draftRecipe.RecipeData["id"].(string); exists && recipeID != "" {
		log.Printf("📝 Updating existing recipe with ID: %s", recipeID)

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
			log.Printf("❌ Error updating recipe: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update recipe"})
			return
		}

		// 更新後のレシピを取得
		if err := tx.Where("id = ?", recipeID).First(&recipe).Error; err != nil {
			tx.Rollback()
			log.Printf("❌ Error fetching updated recipe: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch updated recipe"})
			return
		}
	} else {
		log.Println("📝 Creating new recipe")
		// 新規レシピの作成
		if err := tx.Create(&recipe).Error; err != nil {
			tx.Rollback()
			log.Printf("❌ Error creating new recipe: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create new recipe"})
			return
		}
	}

	// 既存のingredientsを削除
	if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{}).Error; err != nil {
		tx.Rollback()
		log.Printf("❌ Error deleting existing ingredients: %v", err)
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
				QuantityRequired: int(ingMap["quantity"].(float64)),
			}
			if err := tx.Create(&recipeIngredient).Error; err != nil {
				tx.Rollback()
				log.Printf("❌ Error saving recipe ingredient: %v", err)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save recipe ingredients"})
				return
			}
		}
	}

	// トランザクションのコミット
	if err := tx.Commit().Error; err != nil {
		log.Printf("❌ Error committing transaction: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to commit transaction"})
		return
	}

	// Redisに保存
	key := fmt.Sprintf("draft_recipe:%s", draftRecipe.UserID)
	jsonData, err := json.Marshal(draftRecipe)
	if err != nil {
		log.Printf("❌ Error marshaling draft recipe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process draft recipe",
			"details": err.Error(),
		})
		return
	}
	log.Printf("📦 Marshaled JSON data: %s", string(jsonData))

	// Redisへの保存を試みる
	ctx := context.Background()
	err = h.RedisClient.Set(ctx, key, jsonData, 24*time.Hour).Err()
	if err != nil {
		log.Printf("❌ Error saving to Redis: %v", err)
		log.Printf("❌ Redis key: %s", key)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to save draft recipe",
			"details": err.Error(),
		})
		return
	}
	log.Printf("✅ Successfully saved draft recipe to Redis with key: %s", key)

	c.JSON(http.StatusOK, gin.H{"message": "Draft recipe saved successfully", "recipe": recipe})
}

// GetDraftRecipes は下書きレシピを取得するハンドラ
func (h *AdminHandler) GetDraftRecipes(c *gin.Context) {
	log.Println("🔥 Starting GetDraftRecipes")

	// RedisClientのnilチェック
	if h.RedisClient == nil {
		log.Println("❌ Redis client is not initialized")
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Redis client not initialized"})
		return
	}

	userId := c.Param("userId")
	if userId == "" {
		log.Println("❌ UserID is required")
		c.JSON(http.StatusBadRequest, gin.H{"error": "user ID is required"})
		return
	}

	log.Printf("📦 Fetching draft recipe for user: %s", userId)

	// Redisへの接続テスト
	ctx := context.Background()
	if err := h.RedisClient.Ping(ctx).Err(); err != nil {
		log.Printf("❌ Redis connection error: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to connect to Redis"})
		return
	}

	// Redisから下書きレシピを取得
	key := fmt.Sprintf("draft_recipe:%s", userId)
	val, err := h.RedisClient.Get(ctx, key).Result()
	if err == redis.Nil {
		log.Printf("ℹ️ No draft recipe found for user: %s", userId)
		c.JSON(http.StatusOK, gin.H{"draftRecipes": []interface{}{}})
		return
	} else if err != nil {
		log.Printf("❌ Error getting draft recipe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get draft recipes"})
		return
	}

	log.Printf("✅ Found draft recipe: %s", val)

	// JSONをパース
	var draftRecipe struct {
		UserID         string                 `json:"userId"`
		RecipeData     map[string]interface{} `json:"recipeData"`
		LastModifiedAt string                 `json:"lastModifiedAt"`
	}
	if err := json.Unmarshal([]byte(val), &draftRecipe); err != nil {
		log.Printf("❌ Error parsing draft recipe: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to parse draft recipe"})
		return
	}

	// レスポンスの形式を統一
	response := gin.H{
		"draftRecipes": []interface{}{draftRecipe},
	}
	log.Printf("✅ Sending response: %+v", response)
	c.JSON(http.StatusOK, response)
}
