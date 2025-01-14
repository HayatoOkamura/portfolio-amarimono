package db

import (
	"log"

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
	dsn := "host=db user=postgres password=password dbname=db port=5432 sslmode=disable TimeZone=Asia/Tokyo"
	DB, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Fatalf("Failed to open database connection: %v", err)
	}
	log.Println("Database connection established")
}
