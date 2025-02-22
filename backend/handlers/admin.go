package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strconv"
	"time"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

// 画像保存処理
func saveImage(c *gin.Context, file *multipart.FileHeader, dir string) (string, error) {
	saveDir := filepath.Join(".", "uploads", dir)
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			return "", err
		}
	}

	// 一意のファイル名を生成（タイムスタンプ + 元のファイル名）
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)

	if err := c.SaveUploadedFile(file, savePath); err != nil {
		return "", err
	}
	return fmt.Sprintf("http://localhost:8080/static/%s", uniqueFilename), nil
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
		var recipeIDs []int
		if err := tx.Table("recipe_ingredients").
			Select("recipe_id").
			Where("ingredient_id = ?", id).
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
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").Find(&recipes).Error; err != nil {
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
	if userIDStr == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	// UUID のバリデーション
	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID format"})
		return
	}
	recipe.UserID = &userID

	// `public` フラグの処理
	publicStr := c.PostForm("public")
	if publicStr == "false" {
		recipe.Public = false
	} else {
		recipe.Public = true // デフォルトで公開
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

	// レビュー
	reviews, err := strconv.ParseFloat(c.PostForm("reviews"), 64)
	if err != nil || reviews < 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid reviews"})
		return
	}
	recipe.Reviews = reviews

	// コストの見積もり
	costEstimate := c.PostForm("costEstimate")
	if costEstimate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cost estimate is required"})
		return
	}
	recipe.CostEstimate = costEstimate

	// サマリー
	summary := c.PostForm("summary")
	if summary == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Summary is required"})
		return
	}
	recipe.Summary = summary

	// サマリー
	catchphrase := c.PostForm("catchphrase")
	if catchphrase == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Catchphrase is required"})
		return
	}
	recipe.Catchphrase = catchphrase

	// ジャンルIDの取得
	genreID, err := strconv.Atoi(c.PostForm("genre"))
	if err != nil || genreID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
		return
	}

	// ジャンルが存在するか確認
	var genre models.RecipeGenre
	if err := h.DB.Where("id = ?", genreID).First(&genre).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre"})
		return
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
				imageURL, err := saveImage(c, imageFile, savePath)
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
		imageURL, err := saveImage(c, imageFile, recipeFolder)
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
	if err := h.DB.Preload("Genre").Preload("Ingredients.Ingredient.Unit").First(&recipe, id).Error; err != nil {
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
	reviews, _ := strconv.ParseFloat(c.PostForm("reviews"), 64)
	costEstimate := c.PostForm("costEstimate")
	summary := c.PostForm("summary")
	catchphrase := c.PostForm("catchphrase")
	genreID, err := strconv.Atoi(c.PostForm("genre"))
	if err != nil || genreID <= 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid genre ID"})
		return
	}

	// 画像の保存処理
	if imageFile, err := c.FormFile("image"); err == nil {
		imageURL, err := saveImage(c, imageFile, recipeFolder)
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
				imageURL, err := saveImage(c, imageFile, savePath)
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
	if err := tx.Model(&recipe).Updates(models.Recipe{
		Name:         name,
		CookingTime:  cookingTime,
		Reviews:      reviews,
		CostEstimate: costEstimate,
		Summary:      summary,
		Nutrition:    recipe.Nutrition,
		Catchphrase:  catchphrase,
		GenreID:      genreID,
		ImageUrl:     recipe.ImageUrl,
		Instructions: recipe.Instructions,
	}).Error; err != nil {
		tx.Rollback()
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

		tx.Where("recipe_id = ?", recipe.ID).Delete(&models.RecipeIngredient{})
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

	c.JSON(http.StatusOK, gin.H{"message": "Recipe updated successfully", "recipe": recipe})
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
