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
	// 名前を受け取る
	name := c.PostForm("name")
	if name == "" {
		log.Println("Error: Name is missing") // ログ追加
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}

	// ジャンルを受け取る (JSON形式の文字列)
	genreJSON := c.PostForm("genre")
	if genreJSON == "" {
		log.Println("Error: Genre is missing") // ログ追加
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre is required"})
		return
	}

	// genreJSON をパース
	var genreReq struct {
		ID   int    `json:"id" binding:"required"`
		Name string `json:"name" binding:"required"`
	}
	if err := json.Unmarshal([]byte(genreJSON), &genreReq); err != nil {
		log.Println("Error parsing genre JSON:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre format"})
		return
	}

	// ジャンルが存在するか確認
	var genre models.IngredientGenre
	if err := h.DB.Where("id = ?", genreReq.ID).First(&genre).Error; err != nil {
		log.Println("Error: Genre not found:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
	}

	// 単位を受け取る (JSON形式の文字列)
	unitJSON := c.PostForm("unit")
	if unitJSON == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Unit is required"})
		return
	}

	// unitJSONをパース
	var unitReq struct {
		ID   int    `json:"id" binding:"required"`
		Name string `json:"name" binding:"required"`
	}
	if err := json.Unmarshal([]byte(unitJSON), &unitReq); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit format"})
		return
	}

	// 単位が存在するか確認
	var unit models.Unit
	if err := h.DB.Where("id = ?", unitReq.ID).First(&unit).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid unit"})
		return
	}

	// ファイルを受け取る
	file, err := c.FormFile("image")
	if err != nil {
		log.Println("Error: Image file is missing:", err) // ログ追加
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// ファイルを保存するディレクトリ
	saveDir := filepath.Join(".", "uploads", "recipe")
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		log.Println("Uploads directory does not exist, creating it...")
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			log.Println("Error creating uploads directory:", err) // ログ追加
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}
	}

	// ファイルを保存
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		log.Println("Error saving uploaded file:", err) // ログ追加
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	ingredient := models.Ingredient{
		Name:     name,
		GenreID:  genre.ID,
		UnitID:   unit.ID,
		ImageUrl: savePath,
	}

	// 具材名の重複をチェック
	var count int64
	if err := h.DB.Model(&models.Ingredient{}).Where("name = ?", ingredient.Name).Count(&count).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for duplicate ingredient"})
		return
	}

	if count > 0 {
		log.Println("Error: Ingredient already exists") // ログ追加
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材を追加
	if err := h.DB.Create(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
		return
	}

	log.Println("Ingredient added successfully:", ingredient) // 成功時ログ
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

	// ingredientsを一緒にロードするためにPreloadを使用
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").Preload("Reviews").Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// AddRecipe /admin/recipes(POST) レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {
	var recipe models.Recipe

	// 認証済みのユーザー情報を取得（例: JWTから取得）
	userIDStr := c.PostForm("userId")
	log.Println("🚨🚨🚨", userIDStr)
	if userIDStr != "" {
		userID, err := uuid.Parse(userIDStr)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
			return
		}
		recipe.UserID = &userID
	}

	// `public` フラグの処理
	publicStr := c.PostForm("isPublic")
	if publicStr == "false" {
		recipe.IsPublic = false
	} else {
		recipe.IsPublic = true // デフォルトで公開
	}

	// `is_draft` フラグの処理
	isDraftStr := c.PostForm("is_draft")
	if isDraftStr == "true" {
		recipe.IsDraft = true
	} else {
		recipe.IsDraft = false // デフォルトで下書きではない
	}

	// レシピ名の取得とバリデーション
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	recipe.Name = name

	// フォルダ名を作成
	recipeFolder := sanitizeFolderName(name)

	// 調理時間
	cookingTime, err := strconv.Atoi(c.PostForm("cookingTime"))
	if err != nil || cookingTime < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cooking time"})
		return
	}
	recipe.CookingTime = cookingTime

	// コストの見積もり
	costEstimate, err := strconv.Atoi(c.PostForm("costEstimate"))
	if err != nil || costEstimate < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cooking time"})
		return
	}
	recipe.CostEstimate = costEstimate

	// サマリー
	summary := c.PostForm("summary")
	if !recipe.IsDraft && summary == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Summary is required"})
		return
	}
	recipe.Summary = summary

	// サマリー
	catchphrase := c.PostForm("catchphrase")
	if !recipe.IsDraft && catchphrase == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Catchphrase is required"})
		return
	}
	recipe.Catchphrase = catchphrase

	// ジャンルIDの取得
	genreID, err := strconv.Atoi(c.PostForm("genre"))
	if err != nil || genreID <= 0 {
		if !recipe.IsDraft {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
			return
		}
		// 下書きの場合はデフォルトのジャンルIDを設定
		genreID = 1
	}

	// ジャンルが存在するか確認
	var genre models.RecipeGenre
	if err := h.DB.Where("id = ?", genreID).First(&genre).Error; err != nil {
		if !recipe.IsDraft {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
			return
		}
		// 下書きの場合はデフォルトのジャンルを設定
		if err := h.DB.First(&genre).Error; err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to set default genre"})
			return
		}
	}
	recipe.GenreID = genreID

	// Nutrition (JSON)
	nutritionJSON := c.PostForm("nutrition")
	if nutritionJSON != "" {
		if err := json.Unmarshal([]byte(nutritionJSON), &recipe.Nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	// FAQ (JSON)
	faqJSON := c.PostForm("faq")
	if faqJSON != "" {
		if err := json.Unmarshal([]byte(faqJSON), &recipe.FAQ); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid FAQ format"})
			return
		}
	}

	// instructions の取得
	instructionsJSON := c.PostForm("instructions")
	if instructionsJSON != "" {
		var tempInstructions models.JSONBInstructions
		if err := json.Unmarshal([]byte(instructionsJSON), &tempInstructions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}

		// instructions の画像アップロード処理
		for i := range tempInstructions {
			// `instruction_image_x` というキーで画像を取得
			fileKey := fmt.Sprintf("instruction_image_%d", i)
			imageFile, err := c.FormFile(fileKey)

			// 最初に c.FormFile を呼ぶことで、フォームデータの解析を完了させる
			_ = imageFile // この行を入れることで、"読み取り済み" にする

			// 画像がある場合のみ処理
			if err == nil {
				// 画像の保存先フォルダを作成
				savePath := filepath.Join(recipeFolder, "instructions")
				imageURL, err := utils.SaveImage(c, imageFile, savePath)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
					return
				}

				// `imageURL` を `recipeFolder` を含む形に修正
				tempInstructions[i].ImageURL = filepath.ToSlash(filepath.Join(recipeFolder, "instructions", filepath.Base(imageURL)))
				log.Println("✅: instruction01", tempInstructions[i].ImageURL)
			}
		}

		log.Println("✅: instruction02", tempInstructions)
		// 更新した instructions を保存
		recipe.Instructions = tempInstructions
	}

	// メイン画像の保存
	imageFile, err := c.FormFile("image")
	if err == nil {
		imageURL, err := utils.SaveImage(c, imageFile, recipeFolder)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save main image"})
			return
		}
		// `imageURL` に `recipeFolder` を含める
		recipe.ImageUrl = filepath.ToSlash(filepath.Join(recipeFolder, filepath.Base(imageURL)))

		log.Println("🚨🚨🚨", imageURL)
	}

	// トランザクション開始
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	log.Println("recipe ⭐️⭐️⭐️", recipe)
	// レシピデータの登録
	if err := tx.Create(&recipe).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe", "details": err.Error()})
		return
	}

	// ingredients の登録
	ingredientsJSON := c.PostForm("ingredients")
	if ingredientsJSON != "" {
		var tempIngredients []struct {
			ID       int `json:"id"`
			Quantity int `json:"quantity"`
		}

		if err := json.Unmarshal([]byte(ingredientsJSON), &tempIngredients); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}

		var recipeIngredients []models.RecipeIngredient

		for _, temp := range tempIngredients {
			// Ingredient が存在するかチェック
			var existingIngredient models.Ingredient
			if err := h.DB.Where("id = ?", temp.ID).First(&existingIngredient).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Ingredient with id %d does not exist", temp.ID)})
				return
			}

			// RecipeIngredient に変換
			recipeIngredients = append(recipeIngredients, models.RecipeIngredient{
				RecipeID:         recipe.ID,
				IngredientID:     temp.ID,
				QuantityRequired: temp.Quantity,
			})
		}

		// ingredients を一括登録
		if len(recipeIngredients) > 0 {
			if err := tx.Create(&recipeIngredients).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe ingredients", "details": err.Error()})
				return
			}
		}
	}

	// 登録後、Ingredient を含めた状態でデータを取得する
	if err := tx.Preload("Ingredients.Ingredient").First(&recipe, recipe.ID).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe with ingredients", "details": err.Error()})
		return
	}

	// コミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Transaction commit failed"})
		return
	}

	// 更新後のレシピデータを取得
	if err := h.DB.Preload("Ingredients.Ingredient").First(&recipe, recipe.ID).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipe after creation"})
		return
	}

	log.Println("😜😜😜", recipe)

	c.JSON(http.StatusCreated, gin.H{"message": "Recipe added successfully", "recipe": recipe})
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
		for i := range tempInstructions {
			fileKey := fmt.Sprintf("instruction_image_%d", i)
			if imageFile, err := c.FormFile(fileKey); err == nil {
				savePath := filepath.Join(recipeFolder, "instructions")
				imageURL, err := utils.SaveImage(c, imageFile, savePath)
				if err != nil {
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save instruction image"})
					return
				}
				tempInstructions[i].ImageURL = filepath.ToSlash(filepath.Join(recipeFolder, "instructions", filepath.Base(imageURL)))
			}
		}
		recipe.Instructions = tempInstructions
	}

	nutritionJSON := c.PostForm("nutrition")
	if nutritionJSON != "" {
		if err := json.Unmarshal([]byte(nutritionJSON), &recipe.Nutrition); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
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
	if ingredientsJSON != "" {
		var tempIngredients []struct {
			ID       int `json:"ingredient_id"`
			Quantity int `json:"quantity_required"`
			UnitId   int `json:"unit_id"`
		}

		if err := json.Unmarshal([]byte(ingredientsJSON), &tempIngredients); err != nil {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}

		// 具材データが空でないことを確認
		if len(tempIngredients) == 0 {
			tx.Rollback()
			c.JSON(http.StatusBadRequest, gin.H{"error": "具材を選択してください"})
			return
		}

		// 既存のingredientsを削除
		if err := tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete existing ingredients"})
			return
		}

		// 新しいingredientsを追加
		var recipeIngredients []models.RecipeIngredient
		for _, temp := range tempIngredients {
			recipeIngredients = append(recipeIngredients, models.RecipeIngredient{
				RecipeID:         recipe.ID,
				IngredientID:     temp.ID,
				QuantityRequired: temp.Quantity,
			})
		}

		if err := tx.Create(&recipeIngredients).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredients"})
			return
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
