package main

import (
	"os"

	"portfolio-amarimono/handlers"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"portfolio-amarimono/db"
)

func main() {
	// Ginをデバッグモードに設定
	gin.SetMode(gin.DebugMode)

	//Ginフレームワークのデフォルトの設定を使用してルータを作成
	r := gin.Default()

	// CORS設定を追加
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"}, // フロントエンドのオリジンを指定
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	}))


	// `RecipeHandler` を初期化
	recipeHandler := &handlers.RecipeHandler{
		FetchRecipes: db.FetchRecipes, // `db.FetchRecipes` を関数として渡す
	}
	adminHandler := &handlers.AdminHandler{
		DB: db.GetDB(), // DB接続を渡す
	}

	// `/api/recipes` エンドポイントの登録
	r.POST("/api/recipes", recipeHandler.GetRecipes)

	// 管理画面用エンドポイント
	admin := r.Group("/admin")
	{
		admin.GET("/ingredients", adminHandler.ListIngredients) // 具材一覧
		admin.POST("/ingredients", adminHandler.AddIngredient) // 具材追加
		admin.POST("/recipes", adminHandler.AddRecipe)         // レシピ追加
	}

	// サーバーを起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
