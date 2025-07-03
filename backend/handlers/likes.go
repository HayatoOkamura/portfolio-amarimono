package handlers

import (
	"fmt"
	"net/http"
	"os"
	"portfolio-amarimono/models"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type LikeHandler struct {
	DB *gorm.DB
}

func NewLikeHandler(db *gorm.DB) *LikeHandler {
	return &LikeHandler{
		DB: db,
	}
}

// ToggleUserLike ユーザーのいいねを追加/削除するエンドポイント
func (h *LikeHandler) ToggleUserLike(c *gin.Context) {
	userID := c.Param("user_id")
	recipeID := c.Param("recipe_id")

	// デバッグログの追加
	fmt.Printf("🔍 ToggleUserLike - User ID: %s, Recipe ID: %s\n", userID, recipeID)
	fmt.Printf("🔍 ToggleUserLike - Environment: %s\n", os.Getenv("ENVIRONMENT"))

	// UUIDのバリデーション
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDの形式が無効です"})
		return
	}
	if _, err := uuid.Parse(recipeID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "レシピIDの形式が無効です"})
		return
	}

	// リトライ機能付きでクエリを実行
	var like models.Like
	var result *gorm.DB
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
		result = tx.Raw("SELECT * FROM likes WHERE user_id = ? AND recipe_id = ? LIMIT 1", userID, recipeID).Scan(&like)
		err = result.Error

		if err == nil {
			break
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			fmt.Printf("🔍 ToggleUserLike - Prepared statement error in SELECT, retrying... (attempt %d/5)\n", retry+1)
			fmt.Printf("🔍 ToggleUserLike - Error details: %v\n", err)
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
	}

	if err != nil {
		fmt.Printf("🔍 ToggleUserLike - Final error in SELECT: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの確認に失敗しました"})
		return
	}

	if result.RowsAffected > 0 {
		// いいねが既に存在する場合は削除
		fmt.Printf("🔍 ToggleUserLike - Like exists, deleting...\n")

		// リトライ機能付きで削除を実行
		for retry := 0; retry < 5; retry++ {
			tx := h.DB.Session(&gorm.Session{
				PrepareStmt:              false,
				SkipDefaultTransaction:   true,
				DisableNestedTransaction: true,
				QueryFields:              true,
				DryRun:                   false,
			})

			// 生のSQLクエリを使用して削除
			err = tx.Exec("DELETE FROM likes WHERE user_id = ? AND recipe_id = ?", userID, recipeID).Error
			if err == nil {
				fmt.Printf("🔍 ToggleUserLike - Successfully deleted like\n")
				c.JSON(http.StatusOK, gin.H{"message": "お気に入りから削除しました"})
				return
			}

			// prepared statementエラーの場合はリトライ
			if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
				fmt.Printf("🔍 ToggleUserLike - Prepared statement error in DELETE, retrying... (attempt %d/5)\n", retry+1)
				waitTime := time.Duration(100*(retry+1)) * time.Millisecond
				time.Sleep(waitTime)
				continue
			}

			break
		}

		fmt.Printf("🔍 ToggleUserLike - Final error in DELETE: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの削除に失敗しました"})
		return
	} else {
		// いいねがない場合は新規追加
		fmt.Printf("🔍 ToggleUserLike - Like does not exist, creating...\n")

		// リトライ機能付きで作成を実行
		for retry := 0; retry < 5; retry++ {
			tx := h.DB.Session(&gorm.Session{
				PrepareStmt:              false,
				SkipDefaultTransaction:   true,
				DisableNestedTransaction: true,
				QueryFields:              true,
				DryRun:                   false,
			})

			// 生のSQLクエリを使用して作成
			err = tx.Exec("INSERT INTO likes (user_id, recipe_id) VALUES (?, ?)", userID, recipeID).Error
			if err == nil {
				fmt.Printf("🔍 ToggleUserLike - Successfully created like\n")
				c.JSON(http.StatusOK, gin.H{"message": "お気に入りに追加しました"})
				return
			}

			// prepared statementエラーの場合はリトライ
			if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
				fmt.Printf("🔍 ToggleUserLike - Prepared statement error in INSERT, retrying... (attempt %d/5)\n", retry+1)
				waitTime := time.Duration(100*(retry+1)) * time.Millisecond
				time.Sleep(waitTime)
				continue
			}

			break
		}

		fmt.Printf("🔍 ToggleUserLike - Final error in INSERT: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの追加に失敗しました"})
		return
	}
}

// GetUserLikes ユーザーのお気に入りレシピを取得するエンドポイント
func (h *LikeHandler) GetUserLikes(c *gin.Context) {
	userID := c.Param("user_id")

	// デバッグログの追加
	fmt.Printf("🔍 GetUserLikes - User ID: %s\n", userID)
	fmt.Printf("🔍 GetUserLikes - Environment: %s\n", os.Getenv("ENVIRONMENT"))

	// UUIDのバリデーション
	if _, err := uuid.Parse(userID); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "ユーザーIDの形式が無効です"})
		return
	}

	var likes []models.Like

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
		err = tx.Raw("SELECT * FROM likes WHERE user_id = ?", userID).Scan(&likes).Error
		if err == nil {
			fmt.Printf("🔍 GetUserLikes - Successfully retrieved %d likes for user: %s\n", len(likes), userID)
			break
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			fmt.Printf("🔍 GetUserLikes - Prepared statement error, retrying... (attempt %d/5)\n", retry+1)
			fmt.Printf("🔍 GetUserLikes - Error details: %v\n", err)
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
	}

	if err != nil {
		fmt.Printf("🔍 GetUserLikes - Final error: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "お気に入りの取得に失敗しました"})
		return
	}

	if len(likes) == 0 {
		c.JSON(http.StatusOK, gin.H{"message": "お気に入りのレシピが見つかりません", "recipes": []models.Recipe{}})
		return
	}

	var recipes []models.Recipe
	for _, like := range likes {
		// RecipeIDがUUIDかチェック
		if _, err := uuid.Parse(like.RecipeID); err != nil {
			continue // 無効なRecipeIDはスキップ
		}

		var recipe models.Recipe
		// レシピ取得もリトライ機能付きで実行
		var recipeErr error
		for retry := 0; retry < 3; retry++ {
			tx := h.DB.Session(&gorm.Session{
				PrepareStmt:              false,
				SkipDefaultTransaction:   true,
				DisableNestedTransaction: true,
				QueryFields:              true,
				DryRun:                   false,
			})

			// 生のSQLクエリを使用してレシピを取得
			recipeErr = tx.Raw(`
				SELECT r.*, rg.name as genre_name
				FROM recipes r
				LEFT JOIN recipe_genres rg ON r.genre_id = rg.id
				WHERE r.id = ?
			`, like.RecipeID).Scan(&recipe).Error

			if recipeErr == nil {
				break
			}

			// prepared statementエラーの場合はリトライ
			if retry < 2 && (strings.Contains(recipeErr.Error(), "prepared statement") && strings.Contains(recipeErr.Error(), "already exists")) {
				waitTime := time.Duration(50*(retry+1)) * time.Millisecond
				time.Sleep(waitTime)
				continue
			}

			break
		}

		if recipeErr != nil {
			continue // レシピ取得に失敗した場合はスキップ
		}

		recipes = append(recipes, recipe)
	}

	fmt.Printf("🔍 GetUserLikes - Successfully retrieved %d recipes for user: %s\n", len(recipes), userID)
	c.JSON(http.StatusOK, recipes)
}
