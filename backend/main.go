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
	log.SetOutput(os.Stdout)

	// Ginをデバッグモードに設定
	gin.SetMode(gin.DebugMode)

	// Ginフレームワークのデフォルトの設定を使用してルータを作成
	r := gin.Default()

	// GinのLoggerミドルウェアを使用
	r.Use(gin.Logger())

	// CORS設定を追加
	var allowOrigins []string
	if os.Getenv("ENVIRONMENT") == "production" {
		// 本番環境では特定のオリジンのみ許可
		allowOrigins = []string{"https://portfolio-amarimono.vercel.app"}
	} else {
		// 開発環境ではローカルネットワークを広く許可
		allowOrigins = []string{"http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.11.2:3000", "https://portfolio-amarimono.vercel.app"}
	}

	r.Use(cors.New(cors.Config{
		AllowOrigins:     allowOrigins,
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization", "Accept-Encoding", "Cookie"},
		ExposeHeaders:    []string{"Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * 60 * 60, // 12 hours
	}))

	// 静的ファイルを提供
	r.Static("/uploads", "./uploads")

	// データベース接続の初期化
	dbConn, err := db.InitDB()
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}

	// マイグレーションの実行（本番環境ではスキップ）
	if os.Getenv("ENVIRONMENT") != "production" {
		sqlDB, err := dbConn.DB.DB()
		if err != nil {
			log.Fatalf("Failed to get database instance: %v", err)
		}
		if err := db.RunMigrations(sqlDB); err != nil {
			log.Fatalf("Failed to run migrations: %v", err)
		}
		log.Println("✅ マイグレーションが完了しました")
	} else {
		log.Println("ℹ️ 本番環境のため、マイグレーションはスキップされました（Supabaseを使用）")
	}

	// Redisクライアントの初期化
	redisClient := redis.NewClient(&redis.Options{
		Addr:     "redis:6379",
		Password: "",
		DB:       0,
	})

	// 認証ハンドラーの初期化
	authHandler := handlers.NewAuthHandler(dbConn.Supabase, nil)

	// Redis接続の確認
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
	} else {
	}

	// ハンドラの初期化
	recipeHandler := handlers.NewRecipeHandler(dbConn.DB)
	likeHandler := handlers.NewLikeHandler(dbConn.DB)
	userHandler := handlers.NewUserHandler(dbConn.DB)
	adminHandler := &handlers.AdminHandler{
		DB:          dbConn.DB,
		RedisClient: redisClient,
	}
	genreHandler := &handlers.GenreHandler{
		DB: dbConn.DB,
	}
	reviewHandler := &handlers.ReviewHandler{
		DB: dbConn.DB,
	}
	recommendationHandler := &handlers.RecommendationHandler{
		DB: dbConn.DB,
	}
	userIngredientDefaultHandler := handlers.NewUserIngredientDefaultHandler(dbConn.DB)
	uploadHandler := handlers.NewUploadHandler()
	aiUsageHandler := handlers.NewAIUsageHandler(dbConn.DB)

	// ルートの設定
	routes.SetupRoutes(r, recipeHandler, likeHandler, userHandler, genreHandler, adminHandler, reviewHandler, recommendationHandler, userIngredientDefaultHandler, aiUsageHandler, dbConn.DB)
	routes.SetupAuthRoutes(r, authHandler)

	// 画像アップロード用のエンドポイント
	r.POST("/api/upload", uploadHandler.UploadImage)

	// 栄養素データ取得API
	r.GET("/api/ingredients/nutrients", handlers.GetNutrientData)

	// サーバーを起動
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	if err := r.Run("0.0.0.0:" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
