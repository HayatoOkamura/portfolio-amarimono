package db

import (
	"fmt"
	"log"
	"os"
	"strings"
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
	log.Println("🚀 データベース接続の初期化を開始します...")

	// 環境変数の取得
	dbHost := os.Getenv("SUPABASE_DB_HOST")
	dbPort := os.Getenv("SUPABASE_DB_PORT")
	dbUser := os.Getenv("SUPABASE_DB_USER")
	dbPassword := os.Getenv("SUPABASE_DB_PASSWORD")
	dbName := os.Getenv("SUPABASE_DB_NAME")
	environment := os.Getenv("ENVIRONMENT")

	// 環境変数の検証
	if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		return nil, fmt.Errorf("database environment variables are not properly set")
	}

	// プロジェクトリファレンスIDの抽出とPooler接続の設定
	var finalHost string
	var finalPort string
	var finalUser string
	var usePooler string

	usePooler = os.Getenv("USE_POOLER")

	if strings.Contains(dbHost, "pooler.supabase.com") {
		finalHost = dbHost
		finalPort = dbPort
		finalUser = dbUser
	} else {
		projectRef := extractProjectRef(dbHost)
		if projectRef == "" {
			return nil, fmt.Errorf("failed to extract project reference ID from host: %s", dbHost)
		}

		if usePooler == "true" {
			finalHost = fmt.Sprintf("%s.pooler.supabase.com", projectRef)
			finalPort = "6543"
			finalUser = fmt.Sprintf("postgres.%s", projectRef)
		} else {
			finalHost = dbHost
			finalPort = dbPort
			finalUser = dbUser
		}
	}

	// 接続文字列の構築
	var dsn string
	if environment == "development" {
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend-dev",
			finalHost, finalPort, finalUser, dbPassword, dbName,
		)
	} else {
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend",
			finalHost, finalPort, finalUser, dbPassword, dbName,
		)
	}

	// GORMの初期化
	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // prepared statementを完全に無効化
	}), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		SkipDefaultTransaction:                   true,
		DisableForeignKeyConstraintWhenMigrating: true,
		QueryFields:                              true,
		DryRun:                                   false,
		DisableAutomaticPing:                     true,
		AllowGlobalUpdate:                        false,
		DisableNestedTransaction:                 true,
		PrepareStmt:                              false,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		log.Printf("❌ GORMの初期化に失敗しました: %v", err)

		// Pooler接続が失敗した場合のフォールバック処理
		if strings.Contains(dbHost, "pooler.supabase.com") || (usePooler == "true" && strings.Contains(finalHost, "pooler.supabase.com")) {
			log.Println("🔄 Pooler接続が失敗しました。Direct Connectionにフォールバックします...")

			fallbackHost := strings.Replace(dbHost, "pooler.supabase.com", "supabase.co", 1)
			if !strings.Contains(fallbackHost, "supabase.co") {
				projectRef := extractProjectRef(dbHost)
				if projectRef != "" {
					fallbackHost = fmt.Sprintf("db.%s.supabase.co", projectRef)
				}
			}

			fallbackPort := "5432"
			fallbackUser := strings.Replace(dbUser, "postgres.", "postgres", 1)

			var fallbackDSN string
			if environment == "development" {
				fallbackDSN = fmt.Sprintf(
					"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend-dev",
					fallbackHost, fallbackPort, fallbackUser, dbPassword, dbName,
				)
			} else {
				fallbackDSN = fmt.Sprintf(
					"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend",
					fallbackHost, fallbackPort, fallbackUser, dbPassword, dbName,
				)
			}

			database, err = gorm.Open(postgres.New(postgres.Config{
				DSN:                  fallbackDSN,
				PreferSimpleProtocol: true, // prepared statementを完全に無効化
			}), &gorm.Config{
				Logger:                                   logger.Default.LogMode(logger.Info),
				SkipDefaultTransaction:                   true,
				DisableForeignKeyConstraintWhenMigrating: true,
				QueryFields:                              true,
				DisableAutomaticPing:                     true,
				AllowGlobalUpdate:                        false,
				PrepareStmt:                              false,
			})
			if err != nil {
				return nil, fmt.Errorf("failed to connect to database (both pooler and direct): %v", err)
			}
			log.Println("✅ フォールバック接続が成功しました")
		} else {
			return nil, fmt.Errorf("failed to connect to database: %v", err)
		}
	}

	// 接続プールの設定
	sqlDB, err := database.DB()
	if err != nil {
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	if environment == "development" {
		sqlDB.SetMaxIdleConns(5)
		sqlDB.SetMaxOpenConns(20)
		sqlDB.SetConnMaxLifetime(time.Hour)
		sqlDB.SetConnMaxIdleTime(30 * time.Minute)
	} else {
		sqlDB.SetMaxIdleConns(1)
		sqlDB.SetMaxOpenConns(3)
		sqlDB.SetConnMaxLifetime(30 * time.Minute)
		sqlDB.SetConnMaxIdleTime(15 * time.Minute)
	}

	// 接続テスト
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// セッション設定（prepared statementエラー対策）
	preparedStatementSettings := []string{
		"SET statement_timeout = '30s'",
		"SET prepared_statement_cache_size = 0",
		"SET max_prepared_statements = 0",
		"SET statement_cache_mode = 'describe'",
		"DEALLOCATE ALL", // 既存のprepared statementをクリア
	}

	for _, setting := range preparedStatementSettings {
		if _, err := sqlDB.Exec(setting); err != nil {
			log.Printf("⚠️ セッション設定に失敗: %s - %v", setting, err)
		}
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

	log.Println("✅ データベース接続の初期化が完了しました！")
	return &DBConfig{
		DB:       database,
		Supabase: supabaseClient,
	}, nil
}

// extractProjectRef はホスト名からプロジェクトリファレンスIDを抽出します
func extractProjectRef(host string) string {
	parts := strings.Split(host, ".")

	if len(parts) < 3 {
		return ""
	}

	var projectRef string

	if strings.Contains(host, "pooler.supabase.com") {
		return ""
	}

	if parts[0] == "db" && len(parts) >= 3 {
		projectRef = parts[1]
	} else {
		projectRef = parts[0]
		if strings.HasPrefix(projectRef, "db") {
			projectRef = strings.TrimPrefix(projectRef, "db")
		}
	}

	if projectRef == "" {
		return ""
	}

	return projectRef
}
