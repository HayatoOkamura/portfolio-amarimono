package mock

import (
	"fmt"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
)

// curl -X POST http://localhost:8080/chat -H "Content-Type: application/json" -d '{"ingredients": { "鶏肉": 2, "トマト": 2, "牛肉": 2 }}'

// RecipeRequest は食材のリストを受け取る構造体
type RecipeRequest struct {
	Ingredients map[string]int `json:"ingredients" binding:"required"`
}

// ChatHandler モック用ハンドラー
func ChatHandler(c *gin.Context) {
	// リクエストボディのバインド
	var recipeRequest RecipeRequest
	if err := c.ShouldBindJSON(&recipeRequest); err != nil {
		log.Printf("Request binding error: %v", err) // 詳細なエラーログ
		log.Printf("Request body: %s", c.Request.Body) // リクエストボディを確認
		c.JSON(http.StatusBadRequest, gin.H{"error": fmt.Sprintf("Invalid request: %v", err)})
		return
	}

	// ログに受け取ったデータを表示
	log.Println("Received ingredients (mock):")
	for ingredient, quantity := range recipeRequest.Ingredients {
		log.Printf("- %s: %d個", ingredient, quantity)
	}

	// 動的なモックレスポンスの生成
	mockRecipes := []string{
		fmt.Sprintf("レシピ1: %sを使った特製料理", listIngredients(recipeRequest.Ingredients)),
		fmt.Sprintf("レシピ2: %sを活用した家庭料理", listIngredients(recipeRequest.Ingredients)),
		fmt.Sprintf("レシピ3: %sの風味豊かなスープ", listIngredients(recipeRequest.Ingredients)),
		fmt.Sprintf("レシピ4: %sのシンプル炒め物", listIngredients(recipeRequest.Ingredients)),
		fmt.Sprintf("レシピ5: %sのボリューム満点ご飯", listIngredients(recipeRequest.Ingredients)),
	}

	// モックレスポンスを返す
	mockResponse := gin.H{
		"recipes": mockRecipes,
	}
	c.JSON(http.StatusOK, mockResponse)
}

// listIngredients は食材リストをフォーマットするヘルパー関数
func listIngredients(ingredients map[string]int) string {
	var formattedIngredients string
	for ingredient, quantity := range ingredients {
		formattedIngredients += fmt.Sprintf("%s (%d個), ", ingredient, quantity)
	}
	if len(formattedIngredients) > 2 {
		formattedIngredients = formattedIngredients[:len(formattedIngredients)-2] // 最後のカンマとスペースを削除
	}
	return formattedIngredients
}
