package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"portfolio-amarimono/handlers/utils"
	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type IngredientHandler struct {
	DB *gorm.DB
}

func NewIngredientHandler(db *gorm.DB) *IngredientHandler {
	return &IngredientHandler{
		DB: db,
	}
}

// ListIngredients 具材一覧を取得
func (h *IngredientHandler) ListIngredients(c *gin.Context) {
	var ingredients []models.Ingredient
	if err := h.DB.Preload("Genre").Preload("Unit").Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients", "details": err.Error()})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}

// AddIngredient 具材を追加
func (h *IngredientHandler) AddIngredient(c *gin.Context) {
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

	// 栄養素データを取得
	nutrition := c.PostForm("nutrition")
	var nutritionInfo models.NutritionInfo
	if nutrition != "" {
		if err := json.Unmarshal([]byte(nutrition), &nutritionInfo); err != nil {
			log.Printf("Error parsing nutrition data: %v", err)
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid nutrition format"})
			return
		}
	}

	// ファイルを受け取る
	file, err := c.FormFile("image")
	if err != nil {
		log.Println("Error: Image file is missing:", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Image file is required"})
		return
	}

	// 具材を先に作成してIDを取得
	ingredient := models.Ingredient{
		Name:    name,
		GenreID: genreIDInt,
		UnitID:  unitIDInt,
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
		log.Printf("Error creating ingredient: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add ingredient"})
		return
	}

	// 画像を保存
	imagePath, err := utils.SaveImage(c, file, "ingredients", fmt.Sprintf("%d", ingredient.ID))
	if err != nil {
		log.Printf("Error saving image: %v", err)
		// 画像の保存に失敗した場合は具材を削除
		h.DB.Delete(&ingredient)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
		return
	}

	// 画像のパスを更新
	ingredient.ImageUrl = imagePath
	if err := h.DB.Save(&ingredient).Error; err != nil {
		log.Printf("Error updating ingredient with image path: %v", err)
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

	log.Println("Ingredient added successfully:", ingredient)
	c.JSON(http.StatusCreated, gin.H{"message": "Ingredient added successfully", "ingredient": ingredient})
}

// UpdateIngredient 具材を更新
func (h *IngredientHandler) UpdateIngredient(c *gin.Context) {
	id := c.Param("id")

	var ingredient models.Ingredient
	if err := h.DB.First(&ingredient, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
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
			log.Printf("Error parsing nutrition data: %v", err)
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
	log.Println("file💩", file)
	if err == nil { // 画像が選択された場合のみ処理
		// SaveImage関数を使用して画像を保存
		imagePath, err := utils.SaveImage(c, file, "ingredients", fmt.Sprintf("%d", ingredient.ID))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save image"})
			return
		}
		// 新しい画像のパスをセット
		ingredient.ImageUrl = imagePath
	} else {
		// 画像が選択されていない場合は、既存のimageUrlを使用
		imageUrl := c.PostForm("image_url")
		log.Println("imageUrl💩", imageUrl)
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

	log.Println("ingredient💩", ingredient)

	// データベースを更新
	if err := h.DB.Save(&ingredient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update ingredient"})
		return
	}

	c.JSON(http.StatusOK, ingredient)
}

// DeleteIngredient 具材を削除
func (h *IngredientHandler) DeleteIngredient(c *gin.Context) {
	id := c.Param("id")

	// 削除する具材を取得
	var ingredient models.Ingredient
	if err := h.DB.First(&ingredient, id).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Ingredient not found"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredient"})
		}
		return
	}

	// 画像が存在する場合は削除
	if ingredient.ImageUrl != "" {
		if err := utils.DeleteImage(ingredient.ImageUrl); err != nil {
			log.Printf("Warning: Failed to delete image: %v", err)
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
