package models

type Recipe struct {
	ID           int                `json:"id" gorm:"primaryKey"`
	Name         string             `json:"name" binding:"required"`
	Instructions JSONBInstructions  `json:"instructions" gorm:"type:jsonb" binding:"required"`
	ImageUrl     string             `json:"image_url"`
	Genre        string             `json:"genre" binding:"required"`
	Ingredients  []RecipeIngredient `json:"ingredients" gorm:"foreignKey:RecipeID" binding:"required,dive"`
}


type RecipeIngredient struct {
	RecipeID         int `json:"recipe_id" gorm:"primaryKey"`
	IngredientID     int `json:"ingredient_id" gorm:"primaryKey"`
	QuantityRequired int `json:"quantity_required"`
}