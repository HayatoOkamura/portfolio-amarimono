package main

import (
	"log"
	"os"

	"portfolio-amarimono/db"
	"portfolio-amarimono/handlers"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func main() {
	log.SetOutput(os.Stdout)              // 標準出力に変更
	log.Println("This is a log message.") // 標準出力に表示される

	// Ginをデバッグモードに設定
	gin.SetMode(gin.DebugMode)

	//Ginフレームワークのデフォルトの設定を使用してルータを作成
	r := gin.Default()

	// GinのLoggerミドルウェアを使用
	r.Use(gin.Logger())

	// CORS設定を追加
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"*"},
		AllowCredentials: true,
	}))

	// 静的ファイルを提供
	r.Static("/uploads", "./uploads")

	// DB接続
	dbConn := db.GetDB()

	// `RecipeHandler` を初期化
	recipeHandler := handlers.NewRecipeHandler(dbConn)

	// ハンドラの初期化
	likeHandler := handlers.NewLikeHandler(dbConn)

	// `UserHandler` を初期化
	userHandler := handlers.NewUserHandler(dbConn)

	adminHandler := &handlers.AdminHandler{
		DB: dbConn,
	}
	genreHandler := &handlers.GenreHandler{
		DB: dbConn,
	}

	// いいね機能のエンドポイント
	r.POST("/api/likes/:user_id/:recipe_id", likeHandler.ToggleUserLike) // レシピにいいねを追加
	r.GET("/api/likes/:user_id", likeHandler.GetUserLikes)               // ユーザーのお気に入りレシピを取得

	// `/api/recipes` エンドポイントの登録
	r.POST("/api/recipes", recipeHandler.SerchRecipes)
	r.GET("/api/recipes/:id", recipeHandler.GetRecipeByID)          // レシピ詳細を取得
	r.GET("/api/recipes/search", recipeHandler.SearchRecipesByName) // レシピ名付検索
	r.GET("/api/user/recipes", recipeHandler.GetUserRecipes)        // 特定のレシピ取得

	// ✅ ユーザー登録エンドポイント
	r.POST("/api/users", userHandler.CreateUser)

	// ✅ ユーザー情報取得エンドポイント（新規追加）
	r.GET("/api/users/:id", userHandler.GetUserProfile)

	// ジャンル取得エンドポイント
	r.GET("/api/recipe_genres", genreHandler.ListRecipeGenres)
	r.GET("/api/ingredient_genres", genreHandler.ListIngredientGenres)

	// 管理画面用エンドポイント
	admin := r.Group("/admin")
	{
		admin.GET("/ingredients", adminHandler.ListIngredients)         // 具材一覧
		admin.POST("/ingredients", adminHandler.AddIngredient)          // 具材追加
		admin.PATCH("/ingredients/:id", adminHandler.UpdateIngredient)  // 具材更新
		admin.DELETE("/ingredients/:id", adminHandler.DeleteIngredient) //具材削除
		admin.GET("/recipes", adminHandler.ListRecipes)                 // レシピ一覧
		admin.POST("/recipes", adminHandler.AddRecipe)                  // レシピ追加
		admin.PUT("/recipes/:id", adminHandler.UpdateRecipe)            // レシピ追加
		admin.DELETE("/recipes/:id", adminHandler.DeleteRecipe)         //具材削除
		admin.GET("/units", adminHandler.ListUnits)                     // レシピ一覧
	}

	// simulateAddIngredient(adminHandler)

	// サーバーを起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
