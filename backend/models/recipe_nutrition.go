package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// 栄養基準値のモデル
type NutritionStandard struct {
	AgeGroup      string  `gorm:"type:varchar(50);not null"` // 年齢層 (例: "18-29", "30-49")
	Gender        string  `gorm:"type:varchar(10);not null"` // "male" または "female"
	Calories      float64 `gorm:"not null"`                  // kcal
	Protein       float64 `gorm:"not null"`                  // g
	Fat           float64 `gorm:"not null"`                  // g
	Carbohydrates float64 `gorm:"not null"`                  // g
	Salt          float64 `gorm:"not null"`                  // g
}

// 栄養成分のJSONB型
type NutritionInfo struct {
	Calories      float64 `json:"calories"`
	Carbohydrates float64 `json:"carbohydrates"`
	Fat           float64 `json:"fat"`
	Protein       float64 `json:"protein"`
	Salt          float64 `json:"salt"`
}

func (n *NutritionInfo) Scan(value interface{}) error {
	if value == nil {
		*n = NutritionInfo{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("failed to scan NutritionInfo: expected []byte or string, got %T", value)
	}

	// 空の値の場合はデフォルト値を設定
	if len(bytes) == 0 || string(bytes) == "null" {
		*n = NutritionInfo{
			Calories:      0,
			Carbohydrates: 0,
			Fat:           0,
			Protein:       0,
			Salt:          0,
		}
		return nil
	}

	return json.Unmarshal(bytes, n)
}

// Value はNutritionInfoをデータベースに保存する
func (n NutritionInfo) Value() (driver.Value, error) {
	// JSONBとして保存するため、バイト配列を返す
	bytes, err := json.Marshal(n)
	if err != nil {
		return nil, err
	}

	// PreferSimpleProtocol: trueの場合、文字列として返す
	return string(bytes), nil
}
