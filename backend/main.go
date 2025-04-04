package main

import (
	"context"
	"log"
	"os"

	"portfolio-amarimono/db"
	"portfolio-amarimono/handlers"
	"portfolio-amarimono/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
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

	// Redisクライアントの初期化
	rdb := redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "", // パスワードがある場合は設定
		DB:       0,  // 使用するDB番号
	})

	// Redis接続の確認
	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		log.Printf("❌ Failed to connect to Redis: %v", err)
	} else {
		log.Println("✅ Successfully connected to Redis")
	}

	// `RecipeHandler` を初期化
	recipeHandler := handlers.NewRecipeHandler(dbConn)

	// ハンドラの初期化
	likeHandler := handlers.NewLikeHandler(dbConn)

	// `UserHandler` を初期化
	userHandler := handlers.NewUserHandler(dbConn)

	adminHandler := &handlers.AdminHandler{
		DB:          dbConn,
		RedisClient: rdb,
	}
	genreHandler := &handlers.GenreHandler{
		DB: dbConn,
	}
	reviewHandler := &handlers.ReviewHandler{
		DB: dbConn,
	}

	recommendationHandler := &handlers.RecommendationHandler{
		DB: dbConn,
	}

	routes.SetupRoutes(r, recipeHandler, likeHandler, userHandler, genreHandler, adminHandler, reviewHandler, recommendationHandler)

	// サーバーを起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
