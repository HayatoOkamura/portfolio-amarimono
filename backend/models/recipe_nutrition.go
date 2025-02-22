package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"

	"gorm.io/gorm"
)

// 栄養基準値のモデル
type NutritionStandard struct {
	gorm.Model
	AgeGroup      string         `gorm:"type:varchar(50);not null"` // 年齢層 (例: "18-29", "30-49")
	Gender        string         `gorm:"type:varchar(10);not null"` // "male" または "female"
	Calories      float64        `gorm:"not null"`                  // kcal
	Protein       float64        `gorm:"not null"`                  // g
	Fat           float64        `gorm:"not null"`                  // g
	Carbohydrates float64        `gorm:"not null"`                  // g
	Sugar         float64        `gorm:"not null"`                  // g
	Salt          float64        `gorm:"not null"`                  // g
	DeletedAt     gorm.DeletedAt `gorm:"index"`
}

// 栄養成分のJSONB型
type NutritionInfo struct {
	Calories      float64 `json:"calories"`
	Carbohydrates float64 `json:"carbohydrates"`
	Fat           float64 `json:"fat"`
	Protein       float64 `json:"protein"`
	Sugar         float64 `json:"sugar"`
	Salt          float64 `json:"salt"`
}

func (n *NutritionInfo) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to scan NutritionInfo: expected []byte, got %T", value)
	}
	return json.Unmarshal(bytes, n)
}

func (n NutritionInfo) Value() (driver.Value, error) {
	return json.Marshal(n)
}
