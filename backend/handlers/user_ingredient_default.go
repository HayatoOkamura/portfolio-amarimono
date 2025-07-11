package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserIngredientDefault struct {
	UserID          models.UUIDString `json:"user_id"`
	IngredientID    int               `json:"ingredient_id"`
	DefaultQuantity int               `json:"default_quantity"`
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
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// デバッグログの追加
	fmt.Printf("🔍 GetUserIngredientDefaults - User ID: %s, UUID: %s\n", userID, userUUID)
	fmt.Printf("🔍 GetUserIngredientDefaults - Environment: %s\n", os.Getenv("ENVIRONMENT"))
	fmt.Printf("🔍 GetUserIngredientDefaults - DB Host: %s\n", os.Getenv("SUPABASE_DB_HOST"))
	fmt.Printf("🔍 GetUserIngredientDefaults - Request Headers: %v\n", c.Request.Header)
	fmt.Printf("🔍 GetUserIngredientDefaults - User Agent: %s\n", c.Request.UserAgent())
	fmt.Printf("🔍 GetUserIngredientDefaults - Remote Addr: %s\n", c.ClientIP())
	fmt.Printf("🔍 GetUserIngredientDefaults - Timestamp: %s\n", time.Now().Format("2006-01-02 15:04:05"))

	var defaults []UserIngredientDefault

	// リトライ機能付きでクエリを実行
	for retry := 0; retry < 5; retry++ {
		// より強力なセッション設定（本番環境対応）
		tx := h.DB.Session(&gorm.Session{
			PrepareStmt:              false,
			SkipDefaultTransaction:   true,
			DisableNestedTransaction: true,
			// 本番環境での追加設定
			QueryFields: true,
			// セッション固有の設定
			DryRun: false,
		})

		// 生のSQLクエリを使用してprepared statementを回避
		err = tx.Raw("SELECT user_id, ingredient_id, default_quantity FROM user_ingredient_defaults WHERE user_id = ?", userUUID).Scan(&defaults).Error
		if err == nil {
			fmt.Printf("🔍 GetUserIngredientDefaults - Successfully retrieved %d defaults for user: %s\n", len(defaults), userUUID)
			break
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			fmt.Printf("🔍 GetUserIngredientDefaults - Prepared statement error, retrying... (attempt %d/5)\n", retry+1)
			fmt.Printf("🔍 GetUserIngredientDefaults - Error details: %v\n", err)
			fmt.Printf("🔍 GetUserIngredientDefaults - User ID: %s\n", userID)
			fmt.Printf("🔍 GetUserIngredientDefaults - Environment: %s\n", os.Getenv("ENVIRONMENT"))
			fmt.Printf("🔍 GetUserIngredientDefaults - Host: %s\n", os.Getenv("SUPABASE_DB_HOST"))
			fmt.Printf("🔍 GetUserIngredientDefaults - Retry timestamp: %s\n", time.Now().Format("2006-01-02 15:04:05"))
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
	}

	if err != nil {
		fmt.Printf("🔍 GetUserIngredientDefaults - Final error: %v\n", err)
		fmt.Printf("🔍 GetUserIngredientDefaults - Final error timestamp: %s\n", time.Now().Format("2006-01-02 15:04:05"))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch user ingredient defaults"})
		return
	}

	c.JSON(http.StatusOK, defaults)
}

// UpdateUserIngredientDefault は認証済みユーザーの具材初期設定を更新します
func (h *UserIngredientDefaultHandler) UpdateUserIngredientDefault(c *gin.Context) {
	userID := c.Query("user_id")
	if userID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "User ID is required"})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user ID"})
		return
	}

	// デバッグログの追加
	fmt.Printf("🔍 UpdateUserIngredientDefault - User ID: %s, UUID: %s\n", userID, userUUID)
	fmt.Printf("🔍 UpdateUserIngredientDefault - Environment: %s\n", os.Getenv("ENVIRONMENT"))

	var updates []map[string]interface{}
	if err := c.ShouldBindJSON(&updates); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// リトライ機能付きでトランザクションを実行
	var finalErr error
	for retry := 0; retry < 5; retry++ {
		// より強力なセッション設定（本番環境対応）
		tx := h.DB.Session(&gorm.Session{
			PrepareStmt:              false,
			SkipDefaultTransaction:   true,
			DisableNestedTransaction: true,
			// 本番環境での追加設定
			QueryFields: true,
			// セッション固有の設定
			DryRun: false,
		})

		// トランザクション開始
		dbTx := tx.Begin()
		if dbTx.Error != nil {
			finalErr = dbTx.Error
			break
		}

		// 既存の設定を削除（生のSQLクエリを使用）
		if err := dbTx.Exec("DELETE FROM user_ingredient_defaults WHERE user_id = ?", userUUID).Error; err != nil {
			dbTx.Rollback()
			finalErr = err

			// prepared statementエラーの場合はリトライ
			if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
				fmt.Printf("🔍 UpdateUserIngredientDefault - Prepared statement error in DELETE, retrying... (attempt %d/5)\n", retry+1)
				fmt.Printf("🔍 UpdateUserIngredientDefault - Error details: %v\n", err)
				// 待機時間を指数関数的に増加
				waitTime := time.Duration(100*(retry+1)) * time.Millisecond
				time.Sleep(waitTime)
				continue
			}
			break
		}

		// 新しい設定を追加
		success := true
		for _, update := range updates {
			defaultData := UserIngredientDefault{
				UserID:          models.FromUUID(userUUID),
				IngredientID:    int(update["ingredient_id"].(float64)),
				DefaultQuantity: int(update["default_quantity"].(float64)),
			}

			// 生のSQLクエリを使用してINSERT
			if err := dbTx.Exec("INSERT INTO user_ingredient_defaults (user_id, ingredient_id, default_quantity) VALUES (?, ?, ?)",
				defaultData.UserID, defaultData.IngredientID, defaultData.DefaultQuantity).Error; err != nil {
				dbTx.Rollback()
				finalErr = err
				success = false

				// prepared statementエラーの場合はリトライ
				if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
					fmt.Printf("🔍 UpdateUserIngredientDefault - Prepared statement error in INSERT, retrying... (attempt %d/5)\n", retry+1)
					fmt.Printf("🔍 UpdateUserIngredientDefault - Error details: %v\n", err)
					// 待機時間を指数関数的に増加
					waitTime := time.Duration(100*(retry+1)) * time.Millisecond
					time.Sleep(waitTime)
					break
				}
				break
			}
		}

		if !success {
			continue
		}

		// トランザクションをコミット
		if err := dbTx.Commit().Error; err != nil {
			finalErr = err

			// prepared statementエラーの場合はリトライ
			if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
				fmt.Printf("🔍 UpdateUserIngredientDefault - Prepared statement error in COMMIT, retrying... (attempt %d/5)\n", retry+1)
				fmt.Printf("🔍 UpdateUserIngredientDefault - Error details: %v\n", err)
				// 待機時間を指数関数的に増加
				waitTime := time.Duration(100*(retry+1)) * time.Millisecond
				time.Sleep(waitTime)
				continue
			}
			break
		}

		// 成功した場合
		fmt.Printf("🔍 UpdateUserIngredientDefault - Successfully updated %d defaults for user: %s\n", len(updates), userUUID)
		c.JSON(http.StatusOK, updates)
		return
	}

	// 最終エラー
	fmt.Printf("🔍 UpdateUserIngredientDefault - Final error: %v\n", finalErr)
	c.JSON(http.StatusInternalServerError, gin.H{"error": finalErr.Error()})
}

// GetIngredientsByCategory はカテゴリ別の具材を取得します
func (h *UserIngredientDefaultHandler) GetIngredientsByCategory(c *gin.Context) {
	categoryID := c.Query("category_id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	// デバッグログの追加
	fmt.Printf("🔍 GetIngredientsByCategory - Category ID: %s\n", categoryID)
	fmt.Printf("🔍 GetIngredientsByCategory - Environment: %s\n", os.Getenv("ENVIRONMENT"))

	var ingredients []struct {
		ID       int    `json:"id"`
		Name     string `json:"name"`
		UnitID   int    `json:"unit_id"`
		UnitName string `json:"unit_name"`
	}

	// リトライ機能付きでクエリを実行
	var err error
	for retry := 0; retry < 5; retry++ {
		// より強力なセッション設定（本番環境対応）
		tx := h.DB.Session(&gorm.Session{
			PrepareStmt:              false,
			SkipDefaultTransaction:   true,
			DisableNestedTransaction: true,
			// 本番環境での追加設定
			QueryFields: true,
			// セッション固有の設定
			DryRun: false,
		})

		// 生のSQLクエリを使用してprepared statementを回避
		err = tx.Raw(`
			SELECT ingredients.id, ingredients.name, ingredients.unit_id, units.name as unit_name
			FROM ingredients
			JOIN units ON ingredients.unit_id = units.id
			WHERE ingredients.genre_id = ?
		`, categoryID).Scan(&ingredients).Error

		if err == nil {
			fmt.Printf("🔍 GetIngredientsByCategory - Successfully retrieved %d ingredients for category: %s\n", len(ingredients), categoryID)
			break
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			fmt.Printf("🔍 GetIngredientsByCategory - Prepared statement error, retrying... (attempt %d/5)\n", retry+1)
			fmt.Printf("🔍 GetIngredientsByCategory - Error details: %v\n", err)
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
	}

	if err != nil {
		fmt.Printf("🔍 GetIngredientsByCategory - Final error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch ingredients by category"})
		return
	}

	c.JSON(http.StatusOK, ingredients)
}
