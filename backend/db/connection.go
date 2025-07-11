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

	// 環境変数の詳細ログ
	log.Printf("🔍 環境変数の確認:")
	log.Printf("   📝 SUPABASE_DB_HOST: %s", dbHost)
	log.Printf("   📝 SUPABASE_DB_PORT: %s", dbPort)
	log.Printf("   📝 SUPABASE_DB_USER: %s", dbUser)
	log.Printf("   📝 SUPABASE_DB_NAME: %s", dbName)
	log.Printf("   📝 USE_POOLER: %s", os.Getenv("USE_POOLER"))
	log.Printf("   📝 ENVIRONMENT: %s", environment)

	// プロジェクトリファレンスIDの抽出とPooler接続の設定
	var finalHost string
	var finalPort string
	var finalUser string
	var usePooler string

	usePooler = os.Getenv("USE_POOLER")

	// 接続設定の詳細ログ
	log.Printf("🔍 接続設定の詳細:")
	log.Printf("   📝 元のホスト: %s", dbHost)
	log.Printf("   📝 元のポート: %s", dbPort)
	log.Printf("   📝 元のユーザー: %s", dbUser)
	log.Printf("   📝 USE_POOLER: %s", usePooler)
	log.Printf("   📝 環境: %s", environment)

	if strings.Contains(dbHost, "pooler.supabase.com") {
		finalHost = dbHost
		finalPort = dbPort
		finalUser = dbUser
		log.Printf("   📝 Pooler接続を使用（既にpooler形式）")
	} else {
		projectRef := extractProjectRef(dbHost)
		if projectRef == "" {
			return nil, fmt.Errorf("failed to extract project reference ID from host: %s", dbHost)
		}
		log.Printf("   📝 プロジェクトリファレンス: %s", projectRef)

		if usePooler == "true" {
			finalHost = fmt.Sprintf("%s.pooler.supabase.com", projectRef)
			finalPort = "6543"
			finalUser = fmt.Sprintf("postgres.%s", projectRef)
			log.Printf("   📝 Pooler接続に変換: %s:%s", finalHost, finalPort)
		} else {
			finalHost = dbHost
			finalPort = dbPort
			finalUser = dbUser
			log.Printf("   📝 Direct接続を使用: %s:%s", finalHost, finalPort)
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
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend prefer_simple_protocol=false disable_prefetch=true",
			finalHost, finalPort, finalUser, dbPassword, dbName,
		)
	}

	// 接続文字列の詳細ログ（パスワードは隠す）
	log.Printf("🔍 最終接続設定:")
	log.Printf("   📝 ホスト: %s", finalHost)
	log.Printf("   📝 ポート: %s", finalPort)
	log.Printf("   📝 ユーザー: %s", finalUser)
	log.Printf("   📝 データベース: %s", dbName)
	sslMode := "require"
	if environment == "development" {
		sslMode = "disable"
	}
	log.Printf("   📝 SSL: %s", sslMode)
	log.Printf("   📝 接続文字列（パスワード除く）: host=%s port=%s user=%s dbname=%s", finalHost, finalPort, finalUser, dbName)

	// GORMの初期化
	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: false, // prepared statementを使用（理想的）
	}), &gorm.Config{
		Logger:                                   logger.Default.LogMode(logger.Info),
		SkipDefaultTransaction:                   true,
		DisableForeignKeyConstraintWhenMigrating: true,
		QueryFields:                              true,
		DryRun:                                   false,
		DisableAutomaticPing:                     true,
		AllowGlobalUpdate:                        false,
		DisableNestedTransaction:                 true,
		PrepareStmt:                              true, // prepared statementを有効化（直接接続対応）
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
					"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend prefer_simple_protocol=false",
					fallbackHost, fallbackPort, fallbackUser, dbPassword, dbName,
				)
			}

			database, err = gorm.Open(postgres.New(postgres.Config{
				DSN:                  fallbackDSN,
				PreferSimpleProtocol: false, // prepared statementを使用（理想的）
			}), &gorm.Config{
				Logger:                                   logger.Default.LogMode(logger.Info),
				SkipDefaultTransaction:                   true,
				DisableForeignKeyConstraintWhenMigrating: true,
				QueryFields:                              true,
				DisableAutomaticPing:                     true,
				AllowGlobalUpdate:                        false,
				PrepareStmt:                              true, // prepared statementを有効化（直接接続対応）
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
		// 本番環境用の設定（直接接続最適化）
		sqlDB.SetMaxIdleConns(5)                   // アイドル接続を増加（直接接続対応）
		sqlDB.SetMaxOpenConns(10)                  // 同時接続数を増加（直接接続対応）
		sqlDB.SetConnMaxLifetime(10 * time.Minute) // 接続の生存時間を延長
		sqlDB.SetConnMaxIdleTime(5 * time.Minute)  // アイドル接続の生存時間を延長
	}

	// 接続テスト
	if err := sqlDB.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	// セッション設定（直接接続最適化）
	preparedStatementSettings := []string{
		"SET statement_timeout = '30s'",
		"SET application_name = 'amarimono-backend'",
		"SET search_path = public",
		// DEALLOCATE ALL を削除（直接接続では不要）
	}

	for _, setting := range preparedStatementSettings {
		if _, err := sqlDB.Exec(setting); err != nil {
			// 警告レベルのログに変更（エラーではない）
			log.Printf("ℹ️ セッション設定スキップ: %s - %v", setting, err)
		} else {
			log.Printf("✅ セッション設定成功: %s", setting)
		}
	}

	// 接続プール設定の詳細ログ
	log.Printf("🔍 接続プール設定:")
	log.Printf("   📝 MaxIdleConns: %d", sqlDB.Stats().MaxIdleClosed)
	log.Printf("   📝 MaxOpenConns: %d", sqlDB.Stats().MaxOpenConnections)
	log.Printf("   📝 ConnMaxLifetime: %v", sqlDB.Stats().MaxLifetimeClosed)
	log.Printf("   📝 ConnMaxIdleTime: %v", sqlDB.Stats().MaxIdleTimeClosed)

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
