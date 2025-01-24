package models

type IngredientGenre struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" binding:"required" gorm:"unique;not null"`
}

func (IngredientGenre) TableName() string {
	return "ingredient_genres"
}
