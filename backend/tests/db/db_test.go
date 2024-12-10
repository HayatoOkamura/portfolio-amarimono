package db_test

import (
	"testing"

	"portfolio-amarimono/db"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"github.com/stretchr/testify/assert"
)

func setupTestDB() (*gorm.DB, error) {
	// テスト用データベース接続情報
	dsn := "postgresql://postgres:password@db:5432/test_db?sslmode=disable"
	gormDB, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		return nil, err
	}

	// クリーンアップ
	cleanupSQL := `
		DROP TABLE IF EXISTS recipe_ingredients;
		DROP TABLE IF EXISTS recipes;
	`

	if err := gormDB.Exec(cleanupSQL).Error; err != nil {
		return nil, err
	}

	// テスト用テーブルを初期化
	initSQL := `
		CREATE TABLE IF NOT EXISTS recipes (
			id SERIAL PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			instructions TEXT NOT NULL
		);
		CREATE TABLE IF NOT EXISTS recipe_ingredients (
			recipe_id INT NOT NULL,
			ingredient_id INT NOT NULL,
			quantity INT NOT NULL,
			PRIMARY KEY (recipe_id, ingredient_id),
			FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
		);

		INSERT INTO recipes (name, instructions) VALUES
			('Tomato Soup', 'Cook tomatoes'),
			('Potato Salad', 'Mix potatoes');
		
		INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity) VALUES
			(1, 1, 2), -- Tomato
			(1, 2, 1), -- Some ingredient
			(2, 2, 1), -- Potato
			(2, 3, 5); -- Carrot
	`
	if err := gormDB.Exec(initSQL).Error; err != nil {
		return nil, err
	}

	return gormDB, nil
}

func TestFetchRecipes(t *testing.T) {
	// テストデータベースをセットアップ
	testDB, err := setupTestDB()
	if err != nil {
		t.Fatalf("Failed to set up test database: %v", err)
	}

	// グローバル変数 db を上書き
	db.SetDB(testDB)

	// テスト用の入力データ
	ingredientIDs := []int{1, 2}
	quantities := []int{1, 5}

	// 関数実行
	recipes, err := db.FetchRecipes(ingredientIDs, quantities)

	// エラーが発生しないことを確認
	assert.NoError(t, err)

	// 結果の確認
	expected := []db.Recipe{
		{ID: 1, Name: "Tomato Soup", Instructions: "Cook tomatoes"},
		{ID: 2, Name: "Potato Salad", Instructions: "Mix potatoes"},
	}

	assert.Equal(t, expected, recipes, "Fetched recipes should match the expected results")
}
