package models

type Ingredient struct {
	ID        int    `json:"id" gorm:"primaryKey"`
	Name      string `json:"name" binding:"required" gorm:"unique;not null"`
	Genre     string `json:"genre" binding:"required" gorm:"not null"`
	ImageUrl  string `json:"image_url" gorm:"not null"`
	Quantity  int    `json:"quantity" gorm:"not null"`
}

func (Ingredient) TableName() string {
	return "ingredients"
}
