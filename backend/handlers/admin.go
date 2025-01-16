package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

// ListIngredients /admin/ingredients(GET) 具材一覧を取得
func (h *AdminHandler) ListIngredients(c *gin.Context) {
	var ingredients []models.Ingredient
	if err := h.DB.Find(&ingredients).Error; err != nil {
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

	// ジャンルを受け取る
	genre := c.PostForm("genre")
	if genre == "" {
		genre = "その他" // デフォルト値
	}

	// ファイルを受け取る
	file, err := c.FormFile("image")
	if err != nil {
		log.Println("Error: Image file is missing:", err) // ログ追加
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// ファイルを保存するディレクトリ
	saveDir := filepath.Join(".", "uploads")
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
		Genre:    genre,
		ImageUrl: savePath,
	}

	// 具材名の重複をチェック
	var count int64
	if err := h.DB.Table("ingredients").Where("name = ?", ingredient.Name).Count(&count).Error; err != nil {
		log.Println("Error checking for duplicate ingredient:", err) // ログ追加
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for duplicate ingredient"})
		return
	}

	if count > 0 {
		log.Println("Error: Ingredient already exists") // ログ追加
		c.JSON(http.StatusConflict, gin.H{"error": "Ingredient already exists"})
		return
	}

	// 新規具材を追加
	if err := h.DB.Table("ingredients").Create(&ingredient).Error; err != nil {
		log.Println("Error adding ingredient to database:", err) // ログ追加
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
		return
	}

	log.Println("Ingredient added successfully:", ingredient) // 成功時ログ
	c.JSON(http.StatusCreated, gin.H{"message": "Ingredient added successfully", "ingredient": ingredient})
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

	// パス設定: Docker プロジェクトの "backend/uploads" ディレクトリを基準
	uploadDir := filepath.Join(".", "backend", "uploads")
	imagePath := filepath.Join(uploadDir, filepath.Base(ingredient.ImageUrl))

	// 具材データを削除
	if err := h.DB.Delete(&models.Ingredient{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient"})
		return
	}

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
	if err := h.DB.Preload("Ingredients").Find(&recipes).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch recipes", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, recipes)
}

// AddRecipe /admin/recipes(POST) レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {
	var recipe models.Recipe

	// レシピ名の取得とバリデーション
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Name is required"})
		return
	}
	recipe.Name = name

	// genre の取得
	genre := c.PostForm("genre")
	if genre == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Genre is required"})
		return
	}
	recipe.Genre = genre  

	// instructions の直接代入
	instructionsJSON := c.PostForm("instructions")
	if instructionsJSON != "" {
		if err := json.Unmarshal([]byte(instructionsJSON), &recipe.Instructions); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid instructions format"})
			return
		}
	}

	// 画像の保存処理
	file, err := c.FormFile("image")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}
	saveDir := filepath.Join(".", "uploads")
	if _, err := os.Stat(saveDir); os.IsNotExist(err) {
		if err := os.MkdirAll(saveDir, os.ModePerm); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create upload directory"})
			return
		}
	}
	uniqueFilename := fmt.Sprintf("%d-%s", time.Now().UnixNano(), file.Filename)
	savePath := filepath.Join(saveDir, uniqueFilename)
	if err := c.SaveUploadedFile(file, savePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}
	recipe.ImageUrl = savePath

	// トランザクション開始
	tx := h.DB.Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	// レシピデータの登録
	if err := tx.Create(&recipe).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe", "details": err.Error()})
		return
	}

	// ingredients の登録
	ingredientsJSON := c.PostForm("ingredients")
	var tempIngredients []models.RecipeIngredient
	if ingredientsJSON != "" {
		if err := json.Unmarshal([]byte(ingredientsJSON), &tempIngredients); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid ingredients format"})
			return
		}

		// recipe_ingredientsテーブルに具材情報を登録
		for _, ingredient := range tempIngredients {
			ingredient.RecipeID = recipe.ID
			if err := tx.Create(&ingredient).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe ingredient", "details": err.Error()})
				return
			}
		}
	}

	// recipe構造体にingredientsを追加
	recipe.Ingredients = tempIngredients

	// コミット処理
	tx.Commit()
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
