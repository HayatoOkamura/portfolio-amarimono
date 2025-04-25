package db

import (
	"log"
	"os"

	"github.com/supabase-community/supabase-go"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type DBConfig struct {
	IsSupabase bool
	Supabase   *supabase.Client
	Postgres   *gorm.DB
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

func init() {
	// 環境変数から接続情報を取得
	useSupabase := os.Getenv("USE_SUPABASE") == "true"
	DB = &DBConfig{
		IsSupabase: useSupabase,
	}

	if useSupabase {
		// Supabase接続
		supabaseUrl := os.Getenv("SUPABASE_URL")
		supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

		if supabaseUrl == "" || supabaseKey == "" {
			log.Fatalf("Supabase environment variables are not properly set")
		}

		var err error
		DB.Supabase, err = supabase.NewClient(supabaseUrl, supabaseKey, nil)
		if err != nil {
			log.Fatalf("Failed to initialize Supabase client: %v", err)
		}
		log.Println("Supabase connection established")
	} else {
		// PostgreSQL接続
		dbHost := os.Getenv("DB_HOST")
		dbPort := os.Getenv("DB_PORT")
		dbUser := os.Getenv("DB_USER")
		dbPassword := os.Getenv("DB_PASSWORD")
		dbName := os.Getenv("DB_NAME")

		if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
			log.Fatalf("PostgreSQL environment variables are not properly set")
		}

		dsn := "host=" + dbHost + " user=" + dbUser + " password=" + dbPassword + " dbname=" + dbName + " port=" + dbPort + " sslmode=disable TimeZone=Asia/Tokyo"

		var err error
		DB.Postgres, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: logger.Default.LogMode(logger.Info),
		})
		if err != nil {
			log.Fatalf("Failed to open database connection: %v", err)
		}
		log.Println("PostgreSQL connection established")
	}
}
