package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/gin-gonic/gin"
)

type NutrientData struct {
	Calories      float64 `json:"calories"`
	Protein       float64 `json:"protein"`
	Fat           float64 `json:"fat"`
	Carbohydrates float64 `json:"carbohydrates"`
	Salt          float64 `json:"salt"`
}

type FoodData map[string]struct {
	Name          string  `json:"name"`
	Calories      float64 `json:"calories"`
	Protein       float64 `json:"protein"`
	Fat           float64 `json:"fat"`
	Carbohydrates float64 `json:"carbohydrates"`
	Salt          float64 `json:"salt"`
}

func GetNutrientData(c *gin.Context) {
	// 食品名をクエリパラメータから取得
	foodName := c.Query("name")
	if foodName == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "食品名が指定されていません"})
		return
	}

	// JSONファイルを読み込む
	foodData, err := loadFoodData()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "食品データの読み込みに失敗しました"})
		return
	}

	// 食品名に一致するデータを検索
	// 完全一致を試みる
	if data, ok := foodData[foodName]; ok {
		respondWithNutrientData(c, data)
		return
	}

	// 部分一致を試みる
	for name, data := range foodData {
		if strings.Contains(name, foodName) {
			respondWithNutrientData(c, data)
			return
		}
	}

	// データが見つからない場合
	c.JSON(http.StatusNotFound, gin.H{"error": "指定された食品のデータが見つかりません"})
}

func loadFoodData() (FoodData, error) {
	// JSONファイルのパスを取得
	jsonPath := filepath.Join("frontend", "app", "utils", "foodData.json")
	data, err := os.ReadFile(jsonPath)
	if err != nil {
		return nil, err
	}

	// JSONデータをパース
	var foodData FoodData
	if err := json.Unmarshal(data, &foodData); err != nil {
		return nil, err
	}

	return foodData, nil
}

func respondWithNutrientData(c *gin.Context, data struct {
	Name          string  `json:"name"`
	Calories      float64 `json:"calories"`
	Protein       float64 `json:"protein"`
	Fat           float64 `json:"fat"`
	Carbohydrates float64 `json:"carbohydrates"`
	Salt          float64 `json:"salt"`
}) {
	nutrientData := NutrientData{
		Calories:      data.Calories,
		Protein:       data.Protein,
		Fat:           data.Fat,
		Carbohydrates: data.Carbohydrates,
		Salt:          data.Salt,
	}

	c.JSON(http.StatusOK, nutrientData)
}
