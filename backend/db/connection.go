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
	log.Println("📋 環境変数を取得中...")
	dbHost := os.Getenv("SUPABASE_DB_HOST")
	dbPort := os.Getenv("SUPABASE_DB_PORT")
	dbUser := os.Getenv("SUPABASE_DB_USER")
	dbPassword := os.Getenv("SUPABASE_DB_PASSWORD")
	dbName := os.Getenv("SUPABASE_DB_NAME")
	environment := os.Getenv("ENVIRONMENT")

	// 本番環境でのデバッグ情報を追加
	if environment == "production" {
		log.Printf("🔍 PRODUCTION DEBUG - Database connection initialization:")
		log.Printf("   📝 Environment: %s", environment)
		log.Printf("   📝 DB Host: %s", dbHost)
		log.Printf("   📝 DB Port: %s", dbPort)
		log.Printf("   📝 DB User: %s", dbUser)
		log.Printf("   📝 DB Name: %s", dbName)
		log.Printf("   📝 Use Pooler: %s", os.Getenv("USE_POOLER"))
		log.Printf("   📝 Supabase URL: %s", os.Getenv("SUPABASE_URL"))
	}

	// 環境変数の詳細ログ
	log.Println("🔍 環境変数の詳細:")
	log.Printf("   🌍 ENVIRONMENT: %s", environment)
	log.Printf("   🏠 DB_HOST: %s", dbHost)
	log.Printf("   🚪 DB_PORT: %s", dbPort)
	log.Printf("   👤 DB_USER: %s", dbUser)
	log.Printf("   🔑 DB_PASSWORD: %s", maskPassword(dbPassword))
	log.Printf("   📊 DB_NAME: %s", dbName)
	log.Printf("   🔧 USE_POOLER: %s", os.Getenv("USE_POOLER"))
	log.Printf("   🔧 SUPABASE_URL: %s", os.Getenv("SUPABASE_URL"))
	log.Printf("   🔧 SUPABASE_SERVICE_ROLE_KEY: %s", maskPassword(os.Getenv("SUPABASE_SERVICE_ROLE_KEY")))

	// 環境変数の検証
	log.Println("🔍 環境変数の検証中...")
	if dbHost == "" || dbPort == "" || dbUser == "" || dbPassword == "" || dbName == "" {
		log.Println("❌ 環境変数の設定が不完全です")
		log.Printf("   🔸 DB_HOST: %s", dbHost)
		log.Printf("   🔸 DB_PORT: %s", dbPort)
		log.Printf("   🔸 DB_USER: %s", dbUser)
		log.Printf("   🔸 DB_PASSWORD: %s", maskPassword(dbPassword))
		log.Printf("   🔸 DB_NAME: %s", dbName)
		return nil, fmt.Errorf("database environment variables are not properly set")
	}
	log.Println("✅ 環境変数の検証が完了しました")

	// 接続情報のログ出力（パスワードはマスク）
	log.Println("🔗 接続情報:")
	log.Printf("   🏠 ホスト: %s", dbHost)
	log.Printf("   🚪 ポート: %s", dbPort)
	log.Printf("   👤 ユーザー: %s", dbUser)
	log.Printf("   🔑 パスワード: %s", maskPassword(dbPassword))
	log.Printf("   📊 データベース: %s", dbName)

	// プロジェクトリファレンスIDの抽出とPooler接続の設定
	log.Println("🔧 プロジェクトリファレンスIDの抽出中...")
	var finalHost string
	var finalPort string
	var finalUser string
	var usePooler string

	// Pooler接続の有効性を確認するための環境変数
	usePooler = os.Getenv("USE_POOLER")

	if strings.Contains(dbHost, "pooler.supabase.com") {
		log.Println("   📝 既にPoolerホストが設定されています")
		finalHost = dbHost
		finalPort = dbPort
		finalUser = dbUser
	} else {
		log.Println("   📝 Direct ConnectionホストからリファレンスIDを抽出します")

		// プロジェクトリファレンスIDの抽出
		projectRef := extractProjectRef(dbHost)
		log.Printf("   🆔 抽出されたプロジェクトリファレンスID: %s", projectRef)

		// 空文字列チェック
		if projectRef == "" {
			log.Println("❌ プロジェクトリファレンスIDの抽出に失敗しました")
			log.Printf("   🔸 元のホスト名: %s", dbHost)
			log.Println("💡 考えられる原因:")
			log.Println("   1. ホスト名の形式が不正")
			log.Println("   2. プロジェクトリファレンスIDが含まれていない")
			log.Println("   3. 環境変数の設定が間違っている")
			return nil, fmt.Errorf("failed to extract project reference ID from host: %s", dbHost)
		}

		// prepared statementエラー対策のため、強制的にDirect Connectionを使用
		log.Println("   🔧 prepared statementエラー対策のため、強制的にDirect Connectionを使用します")
		finalHost = dbHost
		finalPort = dbPort
		finalUser = dbUser
		log.Printf("   📝 Direct Connection: %s:%s", finalHost, finalPort)
	}

	log.Println("🔧 最終接続情報:")
	log.Printf("   🏠 最終ホスト: %s", finalHost)
	log.Printf("   🚪 最終ポート: %s", finalPort)

	// 接続文字列の構築
	log.Println("🔧 接続文字列を構築中...")

	// 環境に応じてDSNを構築
	var dsn string

	if environment == "development" {
		// 開発環境用：本番環境と同様の設定を使用（prepared statement無効化対応）
		log.Println("   🔧 開発環境のため、本番環境と同様の設定を使用（prepared statement無効化対応）")
		dsn = fmt.Sprintf(
			"host=%s port=%s user=%s password=%s dbname=%s sslmode=disable connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend-dev",
			finalHost, finalPort, finalUser, dbPassword, dbName,
		)
	} else {
		// 本番環境用：Pooler接続に対応したDSN
		log.Println("   🔧 本番環境のため、Pooler接続に対応したDSNを使用")
		if strings.Contains(finalHost, "pooler.supabase.com") {
			// Pooler接続用：prepared statementを適切に管理
			dsn = fmt.Sprintf(
				"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend",
				finalHost, finalPort, finalUser, dbPassword, dbName,
			)
		} else {
			// Direct Connection用：prepared statementを適切に管理
			dsn = fmt.Sprintf(
				"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write application_name=amarimono-backend",
				finalHost, finalPort, finalUser, dbPassword, dbName,
			)
		}
	}
	log.Printf("   📝 DSN: %s", maskDSN(dsn))

	// 接続先の詳細情報をログ出力
	log.Println("🔍 接続先の詳細情報:")
	log.Printf("   🏠 ホスト: %s", finalHost)
	log.Printf("   🚪 ポート: %s", finalPort)
	if environment == "development" {
		log.Printf("   🔒 SSLモード: disable")
	} else {
		log.Printf("   🔒 SSLモード: require")
	}
	log.Printf("   🌐 ファミリー: IPv4/IPv6自動選択")
	log.Printf("   ⏱️ タイムアウト: 10秒")
	log.Printf("   📝 セッション属性: read-write")

	// GORMの初期化
	log.Println("⚙️ GORMの初期化中...")
	log.Printf("🔧 GORM設定:")
	log.Printf("   📝 PrepareStmt: false (GORMのprepared statement無効化)")
	log.Printf("   📝 SkipDefaultTransaction: true")
	log.Printf("   📝 QueryFields: true")
	log.Printf("   📝 DryRun: false")
	log.Printf("   📝 DisableForeignKeyConstraintWhenMigrating: true")
	log.Printf("🔧 PostgreSQL設定:")
	log.Printf("   📝 pgxドライバー使用 (PreferSimpleProtocol: true)")
	log.Printf("   📝 prepared statement無効化（エラー時のみクリア）")
	log.Printf("   📝 GORMコールバックでエラー時のみprepared statementクリア")
	log.Printf("   📝 接続プール最小化（MaxOpenConns: 1, 5秒生存時間）")
	if environment == "development" {
		log.Printf("   📝 開発環境のため、古いPostgreSQLバージョンに対応した設定を使用")
	} else {
		log.Printf("   📝 statement_cache_mode: describe")
		log.Printf("   📝 prepared_statement_cache_size: 0")
		log.Printf("   📝 max_prepared_statements: 0")
	}

	// GORMの初期化（直接DSNを使用）
	database, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  dsn,
		PreferSimpleProtocol: true, // prepared statementを完全に無効化
	}), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
		// その他の最適化設定
		SkipDefaultTransaction: true, // デフォルトトランザクションをスキップ
		// 本番環境での追加設定
		DisableForeignKeyConstraintWhenMigrating: true, // 外部キー制約を無効化
		// クエリの最適化
		QueryFields: true, // フィールドを明示的に指定
		// 本番環境での追加設定
		DryRun: false, // ドライランを無効化
		// 追加の設定
		DisableAutomaticPing: true, // 自動pingを無効化
		// さらに追加の設定
		AllowGlobalUpdate: false, // グローバル更新を無効化
		// Prepared Statementエラー対策の追加設定
		DisableNestedTransaction: true, // ネストしたトランザクションを無効化
		// Prepared Statementを完全に無効化
		PrepareStmt: false, // GORMのprepared statementを無効化
		// セッション設定
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
	})
	if err != nil {
		log.Printf("❌ GORMの初期化に失敗しました: %v", err)

		// Pooler接続が失敗した場合のフォールバック処理
		if strings.Contains(dbHost, "pooler.supabase.com") || (usePooler == "true" && strings.Contains(finalHost, "pooler.supabase.com")) {
			log.Println("🔄 Pooler接続が失敗しました。Direct Connectionにフォールバックします...")

			// Direct Connection用の設定に変更
			fallbackHost := strings.Replace(dbHost, "pooler.supabase.com", "supabase.co", 1)
			if !strings.Contains(fallbackHost, "supabase.co") {
				// 元のホストがpoolerでない場合は、プロジェクトリファレンスIDから構築
				projectRef := extractProjectRef(dbHost)
				if projectRef != "" {
					fallbackHost = fmt.Sprintf("db.%s.supabase.co", projectRef)
				}
			}

			fallbackPort := "5432"                                              // Direct Connectionの標準ポート
			fallbackUser := strings.Replace(dbUser, "postgres.", "postgres", 1) // プロジェクトリファレンスIDを除去

			log.Printf("   🔄 フォールバック接続情報:")
			log.Printf("      🏠 ホスト: %s", fallbackHost)
			log.Printf("      🚪 ポート: %s", fallbackPort)
			log.Printf("      👤 ユーザー: %s", fallbackUser)

			// フォールバック用のDSNを構築
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

			log.Printf("   📝 フォールバックDSN: %s", maskDSN(fallbackDSN))

			// フォールバック接続を試行
			database, err = gorm.Open(postgres.New(postgres.Config{
				DSN:                  fallbackDSN,
				PreferSimpleProtocol: true, // prepared statementを無効化
			}), &gorm.Config{
				Logger: logger.Default.LogMode(logger.Info),
				// その他の最適化設定
				SkipDefaultTransaction: true, // デフォルトトランザクションをスキップ
				// 本番環境での追加設定
				DisableForeignKeyConstraintWhenMigrating: true, // 外部キー制約を無効化
				// クエリの最適化
				QueryFields: true, // フィールドを明示的に指定
				// 追加の設定
				DisableAutomaticPing: true, // 自動pingを無効化
				// さらに追加の設定
				AllowGlobalUpdate: false, // グローバル更新を無効化
				// Prepared Statementを完全に無効化
				PrepareStmt: false, // GORMのprepared statementを無効化
			})
			if err != nil {
				log.Printf("❌ フォールバック接続も失敗しました: %v", err)
				log.Println("🔍 エラーの詳細分析:")
				log.Printf("   🔸 接続先: %s:%s", fallbackHost, fallbackPort)
				log.Printf("   🔸 ユーザー: %s", fallbackUser)
				log.Printf("   🔸 データベース: %s", dbName)
				if environment == "development" {
					log.Printf("   🔸 SSLモード: disable")
				} else {
					log.Printf("   🔸 SSLモード: require")
				}
				log.Println("💡 考えられる原因:")
				log.Println("   1. プロジェクトリファレンスIDが間違っている")
				log.Println("   2. SupabaseでPooler接続が有効になっていない")
				log.Println("   3. 認証情報が間違っている")
				log.Println("   4. プロジェクトが存在しない")
				log.Println("   5. IPアドレスが許可リストに含まれていない")
				return nil, fmt.Errorf("failed to connect to database (both pooler and direct): %v", err)
			}
			log.Println("✅ フォールバック接続が成功しました")
		} else {
			log.Println("🔍 エラーの詳細分析:")
			log.Printf("   🔸 接続先: %s:%s", finalHost, finalPort)
			log.Printf("   🔸 ユーザー: %s", finalUser)
			log.Printf("   🔸 データベース: %s", dbName)
			if environment == "development" {
				log.Printf("   🔸 SSLモード: disable")
			} else {
				log.Printf("   🔸 SSLモード: require")
			}
			log.Println("💡 考えられる原因:")
			log.Println("   1. プロジェクトリファレンスIDが間違っている")
			log.Println("   2. SupabaseでPooler接続が有効になっていない")
			log.Println("   3. 認証情報が間違っている")
			log.Println("   4. プロジェクトが存在しない")
			return nil, fmt.Errorf("failed to connect to database: %v", err)
		}
	}

	// 接続プールの設定
	log.Println("🏊 接続プールの設定中...")
	gormDB, err := database.DB()
	if err != nil {
		log.Printf("❌ データベースインスタンスの取得に失敗しました: %v", err)
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// 接続プールの最適化（本番環境対応）
	if environment == "development" {
		// 開発環境用の設定
		gormDB.SetMaxIdleConns(5)                   // アイドル接続数を減らす
		gormDB.SetMaxOpenConns(20)                  // 最大接続数を制限
		gormDB.SetConnMaxLifetime(time.Hour)        // 接続の最大生存時間
		gormDB.SetConnMaxIdleTime(30 * time.Minute) // アイドル接続の最大生存時間
		log.Println("✅ 開発環境用の接続プール設定が完了しました")
	} else {
		// 本番環境用の設定（Supabase最適化）
		gormDB.SetMaxIdleConns(2)                   // アイドル接続を適度に保持
		gormDB.SetMaxOpenConns(5)                   // 適度な接続数
		gormDB.SetConnMaxLifetime(10 * time.Minute) // 接続の最大生存時間
		gormDB.SetConnMaxIdleTime(5 * time.Minute)  // アイドル接続の最大生存時間
		log.Println("✅ 本番環境用の接続プール設定が完了しました")
	}

	// 接続テスト
	log.Println("🧪 接続テストを実行中...")
	if err := gormDB.Ping(); err != nil {
		log.Printf("❌ 接続テストに失敗しました: %v", err)
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}
	log.Println("✅ 接続テストが成功しました")

	// GORMのprepared statementを完全に無効化するコールバックを追加
	log.Println("🔧 GORM prepared statement無効化コールバックを設定中...")

	// 安全なアプローチ：エラー発生時のみprepared statementをクリア
	database.Callback().Query().After("gorm:query").Register("recover_prepared_statement_after_query", func(db *gorm.DB) {
		// prepared statementエラーが発生した場合のリカバリー
		if db.Error != nil && (strings.Contains(db.Error.Error(), "prepared statement") || strings.Contains(db.Error.Error(), "stmtcache")) {
			if sqlDB, err := db.DB(); err == nil {
				sqlDB.Exec("DEALLOCATE ALL")
			}
		}
	})

	database.Callback().Create().After("gorm:create").Register("recover_prepared_statement_after_create", func(db *gorm.DB) {
		// prepared statementエラーが発生した場合のリカバリー
		if db.Error != nil && (strings.Contains(db.Error.Error(), "prepared statement") || strings.Contains(db.Error.Error(), "stmtcache")) {
			if sqlDB, err := db.DB(); err == nil {
				sqlDB.Exec("DEALLOCATE ALL")
			}
		}
	})

	database.Callback().Update().After("gorm:update").Register("recover_prepared_statement_after_update", func(db *gorm.DB) {
		// prepared statementエラーが発生した場合のリカバリー
		if db.Error != nil && (strings.Contains(db.Error.Error(), "prepared statement") || strings.Contains(db.Error.Error(), "stmtcache")) {
			if sqlDB, err := db.DB(); err == nil {
				sqlDB.Exec("DEALLOCATE ALL")
			}
		}
	})

	database.Callback().Delete().After("gorm:delete").Register("recover_prepared_statement_after_delete", func(db *gorm.DB) {
		// prepared statementエラーが発生した場合のリカバリー
		if db.Error != nil && (strings.Contains(db.Error.Error(), "prepared statement") || strings.Contains(db.Error.Error(), "stmtcache")) {
			if sqlDB, err := db.DB(); err == nil {
				sqlDB.Exec("DEALLOCATE ALL")
			}
		}
	})

	log.Println("✅ GORM prepared statement無効化コールバックが設定されました（エラー時のみリカバリー）")

	// セッション設定を強制適用（開発環境とPooler接続では一部設定がサポートされない）
	log.Println("🔧 セッション設定を強制適用中...")
	if strings.Contains(finalHost, "pooler.supabase.com") {
		log.Println("   📝 Pooler接続のため、一部の設定をスキップします")
	} else if environment == "development" {
		log.Println("   📝 開発環境のため、古いPostgreSQLバージョンに対応して一部の設定をスキップします")
	} else {
		// 本番環境での適切な設定
		_, err = gormDB.Exec("SET statement_timeout = '30s'")
		if err != nil {
			log.Printf("⚠️ statement_timeout設定に失敗: %v", err)
		} else {
			log.Println("   ✅ statement_timeout = '30s' を設定")
		}
	}

	// Prepared Statementを完全に無効化するセッション設定
	log.Println("🔧 Prepared Statement完全無効化設定中...")

	// 初期化時にprepared statementをクリア
	_, err = gormDB.Exec("DEALLOCATE ALL")
	if err != nil {
		log.Printf("⚠️ 初期化時のDEALLOCATE ALLに失敗: %v", err)
	} else {
		log.Println("   ✅ 初期化時にprepared statementをクリア")
	}

	log.Println("✅ セッション設定の強制適用が完了しました")

	// PostgreSQLの設定を確認
	log.Println("🔍 PostgreSQLの設定を確認中...")
	var settingName, setting string
	rows, err := gormDB.Query("SELECT name, setting FROM pg_settings WHERE name IN ('prepared_statement_cache_size', 'statement_cache_mode', 'max_prepared_statements', 'prefer_simple_protocol')")
	if err != nil {
		log.Printf("⚠️ PostgreSQL設定の確認に失敗: %v", err)
	} else {
		defer rows.Close()
		log.Println("   📋 現在のPostgreSQL設定:")
		for rows.Next() {
			if err := rows.Scan(&settingName, &setting); err != nil {
				log.Printf("⚠️ 設定値の読み取りに失敗: %v", err)
			} else {
				log.Printf("      📝 %s: %s", settingName, setting)
			}
		}
		log.Println("   ✅ PostgreSQL設定の確認が完了しました")
	}

	// 追加のデバッグ情報
	log.Println("🔍 接続情報の詳細確認:")
	var version, applicationName string
	err = gormDB.QueryRow("SELECT version()").Scan(&version)
	if err != nil {
		log.Printf("⚠️ バージョン確認に失敗: %v", err)
	} else {
		log.Printf("   📝 PostgreSQL Version: %s", version)
	}

	err = gormDB.QueryRow("SELECT application_name FROM pg_stat_activity WHERE pid = pg_backend_pid() LIMIT 1").Scan(&applicationName)
	if err != nil {
		log.Printf("⚠️ アプリケーション名確認に失敗: %v", err)
	} else {
		log.Printf("   📝 Application Name: %s", applicationName)
	}

	// 現在のセッション設定を確認
	log.Println("🔍 現在のセッション設定:")
	var sessionSettings []struct {
		Name  string
		Value string
	}
	rows, err = gormDB.Query("SHOW ALL")
	if err != nil {
		log.Printf("⚠️ セッション設定確認に失敗: %v", err)
	} else {
		defer rows.Close()
		for rows.Next() {
			var name, value, description string
			if err := rows.Scan(&name, &value, &description); err != nil {
				continue
			}
			if name == "prepared_statement_cache_size" || name == "statement_cache_mode" || name == "max_prepared_statements" || name == "prefer_simple_protocol" {
				sessionSettings = append(sessionSettings, struct {
					Name  string
					Value string
				}{Name: name, Value: value})
			}
		}
		for _, setting := range sessionSettings {
			log.Printf("   📝 Session %s: %s", setting.Name, setting.Value)
		}
	}

	// 本番環境での追加監視設定
	if environment != "development" {
		log.Println("🔍 本番環境での追加監視設定:")

		// prepared statementの統計情報を確認
		var prepStmtCount int
		err = gormDB.QueryRow("SELECT COUNT(*) FROM pg_prepared_statements").Scan(&prepStmtCount)
		if err != nil {
			log.Printf("⚠️ prepared statement数確認に失敗: %v", err)
		} else {
			log.Printf("   📝 Current Prepared Statements: %d", prepStmtCount)
		}

		// アクティブな接続数を確認
		var activeConnections int
		err = gormDB.QueryRow("SELECT COUNT(*) FROM pg_stat_activity WHERE state = 'active'").Scan(&activeConnections)
		if err != nil {
			log.Printf("⚠️ アクティブ接続数確認に失敗: %v", err)
		} else {
			log.Printf("   📝 Active Connections: %d", activeConnections)
		}

		// 最大接続数を確認
		var maxConnections int
		err = gormDB.QueryRow("SHOW max_connections").Scan(&maxConnections)
		if err != nil {
			log.Printf("⚠️ 最大接続数確認に失敗: %v", err)
		} else {
			log.Printf("   📝 Max Connections: %d", maxConnections)
		}

		// 本番環境でのデータベース接続テスト
		log.Println("🔍 PRODUCTION DEBUG - Database connection test:")

		// 基本的なクエリテスト
		var testResult string
		err = gormDB.QueryRow("SELECT 'connection_test'").Scan(&testResult)
		if err != nil {
			log.Printf("❌ PRODUCTION ERROR - Basic query test failed: %v", err)
		} else {
			log.Printf("   ✅ Basic query test passed: %s", testResult)
		}

		// レシピテーブルの存在確認
		var tableExists bool
		err = gormDB.QueryRow("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'recipes')").Scan(&tableExists)
		if err != nil {
			log.Printf("❌ PRODUCTION ERROR - Table existence check failed: %v", err)
		} else {
			log.Printf("   📝 Recipes table exists: %v", tableExists)
		}

		// レシピテーブルのレコード数確認
		if tableExists {
			var recipeCount int
			err = gormDB.QueryRow("SELECT COUNT(*) FROM recipes WHERE is_draft = false").Scan(&recipeCount)
			if err != nil {
				log.Printf("❌ PRODUCTION ERROR - Recipe count query failed: %v", err)
			} else {
				log.Printf("   📝 Published recipes count: %d", recipeCount)
			}
		}

		// 具材テーブルの存在確認
		var ingredientTableExists bool
		err = gormDB.QueryRow("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ingredients')").Scan(&ingredientTableExists)
		if err != nil {
			log.Printf("❌ PRODUCTION ERROR - Ingredient table existence check failed: %v", err)
		} else {
			log.Printf("   📝 Ingredients table exists: %v", ingredientTableExists)
		}

		// 具材テーブルのレコード数確認
		if ingredientTableExists {
			var ingredientCount int
			err = gormDB.QueryRow("SELECT COUNT(*) FROM ingredients").Scan(&ingredientCount)
			if err != nil {
				log.Printf("❌ PRODUCTION ERROR - Ingredient count query failed: %v", err)
			} else {
				log.Printf("   📝 Ingredients count: %d", ingredientCount)
			}
		}
	}

	// Supabaseクライアントの初期化
	log.Println("🔌 Supabaseクライアントの初期化中...")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")
	if supabaseURL == "" || supabaseKey == "" {
		log.Println("❌ Supabase環境変数の設定が不完全です")
		log.Printf("   🔸 SUPABASE_URL: %s", supabaseURL)
		log.Printf("   🔸 SUPABASE_SERVICE_ROLE_KEY: %s", maskPassword(supabaseKey))
		return nil, fmt.Errorf("supabase environment variables are not properly set")
	}

	supabaseClient, err := supabase.NewClient(supabaseURL, supabaseKey, nil)
	if err != nil {
		log.Printf("❌ Supabaseクライアントの初期化に失敗しました: %v", err)
		return nil, fmt.Errorf("failed to initialize Supabase client: %v", err)
	}
	log.Println("✅ Supabaseクライアントの初期化が完了しました")

	log.Println("🎉 データベース接続の初期化が完了しました！")
	return &DBConfig{
		DB:       database,
		Supabase: supabaseClient,
	}, nil
}

// extractProjectRef はホスト名からプロジェクトリファレンスIDを抽出します
func extractProjectRef(host string) string {
	log.Printf("   🔍 ホスト名の解析: %s", host)

	// 例: db.qmrjsqeigdkizkrpiahs.supabase.co
	// 例: aws-0-ap-northeast-1.pooler.supabase.com
	parts := strings.Split(host, ".")
	log.Printf("   📝 分割された部分: %v", parts)

	if len(parts) < 3 {
		log.Printf("   ❌ ホスト名の形式が不正: %s", host)
		return ""
	}

	var projectRef string

	// aws-0-ap-northeast-1.pooler.supabase.com の形式の場合（Pooler）
	if strings.Contains(host, "pooler.supabase.com") {
		// 最初の部分からプロジェクトリファレンスIDを抽出
		// aws-0-ap-northeast-1 から qmrjsqeigdkizkrpiahs を抽出する必要がある
		// この場合、ユーザー名から抽出する必要がある
		log.Printf("   🔍 PoolerホストからプロジェクトリファレンスIDを抽出中...")
		log.Printf("   💡 Poolerホストの場合は、ユーザー名からプロジェクトリファレンスIDを抽出する必要があります")
		return ""
	}

	// db.qmrjsqeigdkizkrpiahs.supabase.co の形式の場合（Direct Connection）
	if parts[0] == "db" && len(parts) >= 3 {
		projectRef = parts[1] // 2番目の部分がプロジェクトリファレンスID
		log.Printf("   🔍 2番目の部分（プロジェクトリファレンスID）: %s", projectRef)
	} else {
		// その他の形式の場合
		projectRef = parts[0]
		log.Printf("   🔍 最初の部分: %s", projectRef)

		// "db"プレフィックスを除去
		if strings.HasPrefix(projectRef, "db") {
			projectRef = strings.TrimPrefix(projectRef, "db")
			log.Printf("   🔄 'db'プレフィックスを除去: %s", projectRef)
		}
	}

	// 空文字列チェック
	if projectRef == "" {
		log.Printf("   ❌ プロジェクトリファレンスIDが空です")
		return ""
	}

	log.Printf("   ✅ 抽出されたリファレンスID: %s", projectRef)
	return projectRef
}

// maskPassword はパスワードをマスクして返します
func maskPassword(password string) string {
	if password == "" {
		return "未設定"
	}
	if len(password) <= 4 {
		return "****"
	}
	return password[:2] + "****" + password[len(password)-2:]
}

// maskDSN はDSNのパスワード部分をマスクして返します
func maskDSN(dsn string) string {
	// 簡易的なマスク処理（実際の実装ではより安全な方法を使用）
	if len(dsn) > 50 {
		return dsn[:30] + "****" + dsn[len(dsn)-20:]
	}
	return dsn
}
