package handlers_test

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"portfolio-amarimono/handlers"
)

func TestAddIngredient(t *testing.T) {
	// --- Setup ---
	gin.SetMode(gin.TestMode)

	// モックデータベースと SQL モックを作成
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("Failed to create sqlmock: %v", err)
	}
	defer db.Close()

	gormDB, err := gorm.Open(postgres.New(postgres.Config{
		Conn: db,
	}), &gorm.Config{})
	if err != nil {
		t.Fatalf("Failed to open GORM DB: %v", err)
	}

	// ハンドラとルーターをセットアップ
	handler := &handlers.AdminHandler{DB: gormDB}
	router := gin.Default()
	router.POST("/admin/ingredients", handler.AddIngredient)

	// --- Prepare Test Data ---
	// マルチパートリクエストのボディを作成
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)

	// name フィールドを追加
	_ = writer.WriteField("name", "test_ingredient")

	// 画像ファイルのダミーデータを作成
	part, _ := writer.CreateFormFile("image", "test_image.png")
	part.Write([]byte("fake_image_data")) // 仮のファイルデータ

	writer.Close()

	// HTTP リクエストを作成
	req := httptest.NewRequest("POST", "/admin/ingredients", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	// --- SQL Mock Expectations ---
	mock.ExpectBegin()

	mock.ExpectQuery(`SELECT count\(\*\) FROM "ingredients" WHERE name = \$1`).
		WithArgs("test_ingredient").
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	mock.ExpectExec(`INSERT INTO "ingredients" \("name","image_url"\) VALUES \(\$1,\$2\)`).
		WithArgs("test_ingredient", sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	mock.ExpectCommit()

	// --- Test Execution ---
	rec := httptest.NewRecorder()
	router.ServeHTTP(rec, req)

	// --- Assertions ---
	if rec.Code != http.StatusCreated {
		t.Errorf("Expected status %d, but got %d", http.StatusCreated, rec.Code)
	}

	expectedBody := `{"message":"Ingredient added successfully"`
	if !bytes.Contains(rec.Body.Bytes(), []byte(expectedBody)) {
		t.Errorf("Expected response body to contain %s, but got %s", expectedBody, rec.Body.String())
	}

	// モックの期待値がすべて満たされていることを確認
	if err := mock.ExpectationsWereMet(); err != nil {
		t.Errorf("Unfulfilled mock expectations: %v", err)
	}
}
