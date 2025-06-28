package db

import (
	"fmt"
	"os"
	"time"

	"github.com/supabase-community/supabase-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DBConfig struct {
	DB       *gorm.DB
	Supabase *supabase.Client
}

// InitDB はデータベース接続を初期化する関数です。
func InitDB() (*DBConfig, error) {
	// 環境変数の取得
	dbHost := os.Getenv("SUPABASE_DB_HOST")
	dbPort := os.Getenv("SUPABASE_DB_PORT")
	dbUser := os.Getenv("SUPABASE_DB_USER")
	dbPassword := os.Getenv("SUPABASE_DB_PASSWORD")
	dbName := os.Getenv("SUPABASE_DB_NAME")

	// 環境変数の検証
	if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		return nil, fmt.Errorf("database environment variables are not properly set")
	}

	// 接続文字列の構築
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10 target_session_attrs=read-write",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	// GORMの初期化
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// 接続プールの設定
	sqlDB, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// 接続プールの最適化
	sqlDB.SetMaxIdleConns(5)                   // アイドル接続数を減らす
	sqlDB.SetMaxOpenConns(20)                  // 最大接続数を制限
	sqlDB.SetConnMaxLifetime(time.Hour)        // 接続の最大生存時間
	sqlDB.SetConnMaxIdleTime(30 * time.Minute) // アイドル接続の最大生存時間

	// 接続テスト
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// Supabaseクライアントの初期化
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		return nil, fmt.Errorf("supabase environment variables are not properly set")
	}

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Supabase client: %v", err)
	}

	return &DBConfig{
		DB:       database,
		Supabase: supabaseClient,
	}, nil
}
