package db

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

// SetDB はテストなどでDBを上書きするための関数です。
func SetDB(db *gorm.DB) {
	DB = db
}

// GetDB はDBインスタンスを取得する関数です。
func GetDB() *gorm.DB {
	if DB == nil {
		log.Fatalf("Database not initialized")
	}
	return DB
}

func init() {
	var err error

	// 環境変数から接続情報を取得
	dbHost := os.Getenv("DB_HOST")
	dbPort := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	// 環境変数が設定されていない場合はエラー
	if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		log.Fatalf("Database environment variables are not properly set")
	}

	dsn := "host=" + dbHost + " user=" + dbUser + " password=" + dbPassword + " dbname=" + dbName + " port=" + dbPort + " sslmode=disable TimeZone=Asia/Tokyo"

	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	log.Println("Database connection established")
}
