package models

import (
	"time"

	"gorm.io/gorm"
)

type Ingredient struct {
	ID             int             `json:"id" gorm:"primaryKey"`
	Name           string          `json:"name" binding:"required" gorm:"unique;not null"`
	GenreID        int             `json:"genre_id" binding:"required"`
	Genre          IngredientGenre `json:"genre" gorm:"foreignKey:GenreID;references:ID"`
	ImageUrl       string          `json:"image_url"`
	UnitID         int             `json:"unit_id" gorm:"not null"`
	Unit           Unit            `json:"unit" gorm:"foreignKey:UnitID;references:ID"`
	UnitType       UnitType        `json:"unit_type" gorm:"-"`
	Nutrition      NutritionInfo   `json:"nutrition" gorm:"type:jsonb"`
	GramEquivalent float64         `json:"gram_equivalent" gorm:"not null;default:100"` // 100gに相当する量
	CreatedAt      time.Time       `json:"created_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt      time.Time       `json:"updated_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	DeletedAt      *time.Time      `json:"deleted_at" gorm:"index"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}

// CreateIngredient 材料をデータベースに登録
func CreateIngredient(db *gorm.DB, ingredient Ingredient) error {
	if err := db.Create(&ingredient).Error; err != nil {
		return err
	}
	return nil
}

// GetIngredientByID 材料IDで材料を取得
func GetIngredientByID(db *gorm.DB, id int) (*Ingredient, error) {
	var ingredient Ingredient
	if err := db.Preload("Genre").Preload("Unit").First(&ingredient, id).Error; err != nil {
		return nil, err
	}
	return &ingredient, nil
}

// UpdateIngredient 材料情報を更新
func UpdateIngredient(db *gorm.DB, ingredient Ingredient) error {
	if err := db.Save(&ingredient).Error; err != nil {
		return err
	}
	return nil
}

// DeleteIngredient 材料を削除（論理削除）
func DeleteIngredient(db *gorm.DB, id int) error {
	if err := db.Delete(&Ingredient{}, id).Error; err != nil {
		return err
	}
	return nil
}

// ListIngredients 材料一覧を取得
func ListIngredients(db *gorm.DB) ([]Ingredient, error) {
	var ingredients []Ingredient
	if err := db.Preload("Genre").Preload("Unit").Find(&ingredients).Error; err != nil {
		return nil, err
	}
	return ingredients, nil
}
