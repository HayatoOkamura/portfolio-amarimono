package models

type IngredientNameMapping struct {
	ID           int    `json:"id" gorm:"primaryKey"`
	JapaneseName string `json:"japanese_name" gorm:"unique;not null"`
	EnglishName  string `json:"english_name" gorm:"not null"`
}

func (IngredientNameMapping) TableName() string {
	return "ingredient_name_mappings"
}
