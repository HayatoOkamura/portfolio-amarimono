package handlers

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AdminHandler struct {
	DB *gorm.DB
}

// Ingredient は具材モデル
type AdminIngredient struct {
	Name     string `json:"name" binding:"required"` // 必須フィールドとして設定
	Genre    string `json:"genre" binding:"required"`
	ImageUrl string `json:"image_url"`
}

// レシピ追加用モデル
type RecipeRequest struct {
	Name         string `json:"name"`
	Instructions string `json:"instructions"`
	Ingredients  []struct {
		ID       int `json:"id"`
		Quantity int `json:"quantity"`
	} `json:"ingredients"`
}

// ListIngredients /admin/ingredients(GET) 具材一覧を取得
func (h *AdminHandler) ListIngredients(c *gin.Context) {
	var ingredients []Ingredient
	if err := h.DB.Table("ingredients").Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients"})
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
	saveDir := "./uploads/"
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

	ingredient := AdminIngredient{
		Name:     name,
		Genre:    genre,
		ImageUrl: "/uploads/" + uniqueFilename,
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

	// IDを持つ具材を削除
	if err := h.DB.Delete(&Ingredient{}, id).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete ingredient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Ingredient deleted successfully"})
}

// AddRecipe レシピを追加
func (h *AdminHandler) AddRecipe(c *gin.Context) {
	var req RecipeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// トランザクションで処理
	err := h.DB.Transaction(func(tx *gorm.DB) error {
		// レシピを作成
		recipe := map[string]interface{}{
			"name":         req.Name,
			"instructions": req.Instructions,
		}
		if err := tx.Table("recipes").Create(&recipe).Error; err != nil {
			return err
		}

		// 作成したレシピIDを取得
		recipeID := recipe["id"].(int)

		// レシピに必要な具材を登録
		for _, ing := range req.Ingredients {
			recipeIngredient := map[string]interface{}{
				"recipe_id":     recipeID,
				"ingredient_id": ing.ID,
				"quantity":      ing.Quantity,
			}
			if err := tx.Table("recipe_ingredients").Create(&recipeIngredient).Error; err != nil {
				return err
			}
		}

		return nil
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add recipe"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"message": "Recipe added successfully"})
}
