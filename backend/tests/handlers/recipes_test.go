package handlers_test

import (
	"bytes"
	"database/sql"
	"encoding/json"

	"net/http"
	"net/http/httptest"
	"testing"

	"portfolio-amarimono/db"
	"portfolio-amarimono/handlers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestGetRecipes(t *testing.T) {
	// データベース接続のテスト
	database, err := sql.Open("postgres", "postgresql://postgres:password@db:5432/db?sslmode=disable")
	if err != nil {
		t.Fatalf("Failed to open database connection: %v", err)
	}
	defer database.Close()

	err = database.Ping()
	if err != nil {
		t.Fatalf("Database connection failed: %v", err)
	}

	t.Log("Database connection is successful")

	// モックデータベースのセットアップ
	mockFetchRecipes := func(ingredientIDs []int, quantities []int) ([]db.Recipe, error) {
		return []db.Recipe{
			{ID: 1, Name: "Tomato Soup", Instructions: "Cook tomatoes..."},
			{ID: 2, Name: "Potato Salad", Instructions: "Mix potatoes..."},
		}, nil
	}

	// モック関数を注入
	handler := &handlers.RecipeHandler{FetchRecipes: mockFetchRecipes}

	// Gin コンテキストのセットアップ
	gin.SetMode(gin.TestMode)
	router := gin.Default()
	router.POST("/api/recipes", handler.GetRecipes)

	// テストリクエストデータ
	requestBody := []handlers.Ingredient{
		{ID: 1, Name: "Tomato", Quantity: 1},
		{ID: 2, Name: "Potato", Quantity: 1},
		{ID: 3, Name: "Carrot", Quantity: 3},
	}
	jsonData, _ := json.Marshal(requestBody)

	// テストリクエスト
	req, err := http.NewRequest(http.MethodPost, "/api/recipes", bytes.NewBuffer(jsonData))
	assert.NoError(t, err)
	req.Header.Set("Content-Type", "application/json")

	// テストレスポンス
	recorder := httptest.NewRecorder()
	router.ServeHTTP(recorder, req)

	// レスポンスの確認
	assert.Equal(t, http.StatusOK, recorder.Code)

	var response []db.Recipe
	err = json.Unmarshal(recorder.Body.Bytes(), &response)
	assert.NoError(t, err)

	// 期待されるレスポンス
	expected := []db.Recipe{
		{ID: 1, Name: "Tomato Soup", Instructions: "Cook tomatoes..."},
		{ID: 2, Name: "Potato Salad", Instructions: "Mix potatoes..."},
	}
	assert.Equal(t, expected, response)
}
