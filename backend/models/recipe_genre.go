package models

type RecipeGenre struct {
	ID   int    `json:"id" gorm:"primaryKey"`
	Name string `json:"name" binding:"required" gorm:"unique;not null"`
}

func (RecipeGenre) TableName() string {
	return "recipe_genres"
}
