package db

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/lib/pq"
)

// RunMigrations はマイグレーションファイルを実行します
func RunMigrations(db *sql.DB) error {

	// マイグレーションファイルのディレクトリ
	migrationsDir := "db/migrations"

	// マイグレーションファイルを読み込む
	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return fmt.Errorf("failed to read migrations directory: %v", err)
	}

	// トランザクションを開始
	tx, err := db.Begin()
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %v", err)
	}
	defer tx.Rollback()

	// マイグレーション履歴テーブルを作成
	_, err = tx.Exec(`
		CREATE TABLE IF NOT EXISTS migrations (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL UNIQUE,
			applied_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		return fmt.Errorf("failed to create migrations table: %v", err)
	}

	// マイグレーションファイルを実行
	for _, file := range files {
		if !strings.HasSuffix(file.Name(), ".up.sql") {
			continue
		}

		// 既に適用済みかチェック
		var count int
		err = tx.QueryRow("SELECT COUNT(*) FROM migrations WHERE name = $1", file.Name()).Scan(&count)
		if err != nil {
			return fmt.Errorf("failed to check migration status: %v", err)
		}
		if count > 0 {
			continue
		}

		// マイグレーションファイルを読み込む
		content, err := os.ReadFile(filepath.Join(migrationsDir, file.Name()))
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %v", file.Name(), err)
		}

		// マイグレーションを実行
		_, err = tx.Exec(string(content))
		if err != nil {
			return fmt.Errorf("failed to execute migration %s: %v", file.Name(), err)
		}

		// マイグレーション履歴に記録
		_, err = tx.Exec("INSERT INTO migrations (name) VALUES ($1)", file.Name())
		if err != nil {
			return fmt.Errorf("failed to record migration %s: %v", file.Name(), err)
		}

	}

	// トランザクションをコミット
	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %v", err)
	}

	return nil
}
