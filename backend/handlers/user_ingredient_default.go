package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserIngredientDefault struct {
	UserID          uuid.UUID `json:"user_id"`
	IngredientID    int       `json:"ingredient_id"`
	DefaultQuantity int       `json:"default_quantity"`
}

type UserIngredientDefaultHandler struct {
	DB *gorm.DB
}

func NewUserIngredientDefaultHandler(db *gorm.DB) *UserIngredientDefaultHandler {
	return &UserIngredientDefaultHandler{
		DB: db,
	}
}

// GetIngredientDefaults は認証不要で具材の初期設定を取得します
func (h *UserIngredientDefaultHandler) GetIngredientDefaults(c *gin.Context) {
	// リクエストヘッダーを確認
	fmt.Printf("Request headers: %v\n", c.Request.Header)

	// クッキーから設定を取得
	defaults, err := c.Cookie("ingredient_defaults")
	if err != nil {
		fmt.Printf("Error reading cookie: %v\n", err)
		// クッキーが存在しない場合は空の配列を返す
		c.JSON(http.StatusOK, []interface{}{})
		return
	}

	fmt.Printf("Retrieved cookie data: %s\n", defaults)

	// クッキーの値をJSONとしてパース
	var ingredientDefaults []map[string]interface{}
	if err := json.Unmarshal([]byte(defaults), &ingredientDefaults); err != nil {
		fmt.Printf("Error parsing cookie data: %v\n", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid cookie data"})
		return
	}

	fmt.Printf("Parsed ingredient defaults: %+v\n", ingredientDefaults)
	c.JSON(http.StatusOK, ingredientDefaults)
}

// UpdateIngredientDefaults は認証不要で具材の初期設定を更新します
func (h *UserIngredientDefaultHandler) UpdateIngredientDefaults(c *gin.Context) {
	var updates []map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 更新データをJSONに変換
	jsonData, err := json.Marshal(updates)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process data"})
		return
	}

	// デバッグログ
	fmt.Printf("Setting cookie with data: %s\n", string(jsonData))

	// SameSite属性を設定
	c.SetSameSite(http.SameSiteLaxMode)

	// クッキーに保存（30日間有効）
	c.SetCookie(
		"ingredient_defaults",
		string(jsonData),
		30*24*60*60, // 30 days
		"/",
		"",    // ドメインを空に設定
		false, // secure
		false, // httpOnly
	)

	// レスポンスヘッダーを確認
	fmt.Printf("Response headers: %v\n", c.Writer.Header())

	// クッキーが設定されたことを確認（オプション）
	if cookie, err := c.Cookie("ingredient_defaults"); err == nil {
		fmt.Printf("Cookie successfully set: %s\n", cookie)
	} else {
		fmt.Printf("Note: Cookie verification failed: %v\n", err)
	}

	c.JSON(http.StatusOK, updates)
}

// GetUserIngredientDefaults は認証済みユーザーの具材初期設定を取得します
func (h *UserIngredientDefaultHandler) GetUserIngredientDefaults(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var defaults []UserIngredientDefault
	if err := h.DB.Where("user_id = ?", userUUID).Find(&defaults).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user ingredient defaults"})
		return
	}

	c.JSON(http.StatusOK, defaults)
}

// UpdateUserIngredientDefault は認証済みユーザーの具材初期設定を更新します
func (h *UserIngredientDefaultHandler) UpdateUserIngredientDefault(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	var updates []map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// トランザクション開始
	tx := h.DB.Begin()

	// 既存の設定を削除
	if err := tx.Where("user_id = ?", userUUID).Delete(&UserIngredientDefault{}).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 新しい設定を追加
	for _, update := range updates {
		defaultData := UserIngredientDefault{
			UserID:          userUUID,
			IngredientID:    int(update["ingredient_id"].(float64)),
			DefaultQuantity: int(update["default_quantity"].(float64)),
		}
		if err := tx.Create(&defaultData).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, updates)
}

// GetIngredientsByCategory はカテゴリ別の具材を取得します
func (h *UserIngredientDefaultHandler) GetIngredientsByCategory(c *gin.Context) {
	categoryID := c.Query("category_id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	var ingredients []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		UnitID   int    `json:"unit_id"`
		UnitName string `json:"unit_name"`
	}

	if err := h.DB.Table("ingredients").
		Select("ingredients.id, ingredients.name, ingredients.unit_id, units.name as unit_name").
		Joins("JOIN units ON ingredients.unit_id = units.id").
		Where("ingredients.genre_id = ?", categoryID).
		Find(&ingredients).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients by category"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}
