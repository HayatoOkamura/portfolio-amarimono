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
		AllowOrigins:     []string{"http://localhost:3000", "https://portfolio-amarimono.vercel.app"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Accept-Encoding"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
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
	recipeHandler := handlers.NewRecipeHandler(dbConn.Postgres)

	// ハンドラの初期化
	likeHandler := handlers.NewLikeHandler(dbConn.Postgres)

	// `UserHandler` を初期化
	userHandler := handlers.NewUserHandler(dbConn.Postgres)

	adminHandler := &handlers.AdminHandler{
		DB:          dbConn.Postgres,
		RedisClient: rdb,
	}
	genreHandler := &handlers.GenreHandler{
		DB: dbConn.Postgres,
	}
	reviewHandler := &handlers.ReviewHandler{
		DB: dbConn.Postgres,
	}

	recommendationHandler := &handlers.RecommendationHandler{
		DB: dbConn.Postgres,
	}

	// ハンドラーの初期化
	uploadHandler := handlers.NewUploadHandler()

	routes.SetupRoutes(r, recipeHandler, likeHandler, userHandler, genreHandler, adminHandler, reviewHandler, recommendationHandler)

	// 画像アップロード用のエンドポイント
	r.POST("/api/upload", uploadHandler.UploadImage)

	// サーバーを起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r.Run(":" + port)
}
