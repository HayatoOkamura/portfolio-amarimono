package models

type Ingredient struct {
	ID       int             `json:"id" gorm:"primaryKey"`
	Name     string          `json:"name" binding:"required" gorm:"unique;not null"`
	GenreID  int             `json:"genre_id" binding:"required"`
	Genre    IngredientGenre `json:"genre" gorm:"foreignKey:GenreID;references:ID"`
	ImageUrl string          `json:"image_url"`
	UnitID   int             `json:"unit_id" gorm:"not null"`
	Unit     Unit            `json:"unit" gorm:"foreignKey:UnitID;references:ID"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}
