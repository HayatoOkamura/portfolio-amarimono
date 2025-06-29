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

	if strings.Contains(dbHost, "pooler.supabase.com") {
		log.Println("   📝 既にPoolerホストが設定されています")
		finalHost = dbHost
		finalPort = dbPort
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

		// Poolerホストの構築
		finalHost = fmt.Sprintf("%s.pooler.supabase.com", projectRef)
		finalPort = "6543" // Poolerの標準ポート

		log.Printf("   🔄 Poolerホストに変換: %s", finalHost)
	}

	log.Println("🔧 最終接続情報:")
	log.Printf("   🏠 最終ホスト: %s", finalHost)
	log.Printf("   🚪 最終ポート: %s", finalPort)

	// 接続文字列の構築
	log.Println("🔧 接続文字列を構築中...")
	dsn := fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=require connect_timeout=10 target_session_attrs=read-write prefer_simple_protocol=true application_name=amarimono-backend",
		finalHost, finalPort, dbUser, dbPassword, dbName,
	)
	log.Printf("   📝 DSN: %s", maskDSN(dsn))

	// GORMの初期化
	log.Println("⚙️ GORMの初期化中...")
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Info),
	})
	if err != nil {
		log.Printf("❌ GORMの初期化に失敗しました: %v", err)
		log.Println("🔍 エラーの詳細分析:")
		log.Printf("   🔸 接続先: %s:%s", finalHost, finalPort)
		log.Printf("   🔸 ユーザー: %s", dbUser)
		log.Printf("   🔸 データベース: %s", dbName)
		log.Printf("   🔸 SSLモード: require")
		log.Println("💡 考えられる原因:")
		log.Println("   1. プロジェクトリファレンスIDが間違っている")
		log.Println("   2. SupabaseでPooler接続が有効になっていない")
		log.Println("   3. 認証情報が間違っている")
		log.Println("   4. プロジェクトが存在しない")
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}
	log.Println("✅ GORMの初期化が完了しました")

	// 接続プールの設定
	log.Println("🏊 接続プールの設定中...")
	sqlDB, err := database.DB()
	if err != nil {
		log.Printf("❌ データベースインスタンスの取得に失敗しました: %v", err)
		return nil, fmt.Errorf("failed to get database instance: %v", err)
	}

	// 接続プールの最適化
	sqlDB.SetMaxIdleConns(5)                   // アイドル接続数を減らす
	sqlDB.SetMaxOpenConns(20)                  // 最大接続数を制限
	sqlDB.SetConnMaxLifetime(time.Hour)        // 接続の最大生存時間
	sqlDB.SetConnMaxIdleTime(30 * time.Minute) // アイドル接続の最大生存時間
	log.Println("✅ 接続プールの設定が完了しました")

	// 接続テスト
	log.Println("🧪 接続テストを実行中...")
	if err := sqlDB.Ping(); err != nil {
		log.Printf("❌ 接続テストに失敗しました: %v", err)
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}
	log.Println("✅ 接続テストが成功しました")

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
	parts := strings.Split(host, ".")
	log.Printf("   📝 分割された部分: %v", parts)

	if len(parts) < 3 {
		log.Printf("   ❌ ホスト名の形式が不正: %s", host)
		return ""
	}

	var projectRef string

	// db.qmrjsqeigdkizkrpiahs.supabase.co の形式の場合
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
