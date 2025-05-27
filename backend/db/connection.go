package db

import (
	"fmt"
	"log"
	"os"
	"time"

	"github.com/supabase-community/supabase-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DBConfig struct {
	Supabase *supabase.Client
	DB       *gorm.DB
}

var DB *DBConfig

// SetDB はテストなどでDBを上書きするための関数です。
func SetDB(db *DBConfig) {
	DB = db
}

// GetDB はDBインスタンスを取得する関数です。
func GetDB() *DBConfig {
	if DB == nil {
		log.Fatalf("Database not initialized")
	}
	return DB
}

func InitDB() (*DBConfig, error) {
	// 環境変数の取得
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	dbHost := os.Getenv("SUPABASE_DB_HOST")
	dbPort := os.Getenv("SUPABASE_DB_PORT")
	dbUser := os.Getenv("SUPABASE_DB_USER")
	dbPassword := os.Getenv("SUPABASE_DB_PASSWORD")
	dbName := os.Getenv("SUPABASE_DB_NAME")

	// 環境変数の検証
	if supabaseURL == "" || supabaseKey == "" || dbHost == "" || dbPort == "" ||
		dbUser == "" || dbPassword == "" || dbName == "" {
		return nil, fmt.Errorf("database environment variables are not properly set")
	}

	// Supabaseクライアントの初期化
	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize Supabase client: %v", err)
	}

	// 接続文字列の構築
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10 target_session_attrs=read-write",
		dbHost, dbPort, dbUser, dbPassword, dbName,
	)

	// GORMの初期化
	db, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	// 接続プールの設定
	sqlDB, err := db.DB()
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

	log.Println("Successfully connected to database")

	return &DBConfig{
		Supabase: supabaseClient,
		DB:       db,
	}, nil
}
