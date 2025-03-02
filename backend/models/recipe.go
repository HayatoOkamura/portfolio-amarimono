package models

import (
	"github.com/google/uuid"
)

type Recipe struct {
	ID           uuid.UUID          `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primaryKey"`
	Name         string             `json:"name" binding:"required"`
	Instructions JSONBInstructions  `json:"instructions" gorm:"type:jsonb" binding:"required"`
	ImageUrl     string             `json:"image_url"`
	GenreID      int                `json:"genre_id" binding:"required"`
	Genre        RecipeGenre        `json:"genre" gorm:"foreignKey:GenreID;references:ID"`
	Ingredients  []RecipeIngredient `json:"ingredients" gorm:"foreignKey:RecipeID" binding:"required,dive"`

	CookingTime  int           `json:"cooking_time"`
	// Reviews      float64       `json:"reviews" gorm:"type:numeric(2,1);default:0"`
	CostEstimate string        `json:"cost_estimate"`
	Summary      string        `json:"summary"`
	Nutrition    NutritionInfo `json:"nutrition" gorm:"type:jsonb"`
	Catchphrase  string        `json:"catchphrase"`
	FAQ          JSONBFaq      `json:"faq" gorm:"type:jsonb"`
	Likes        []Like        `json:"likes"`

	UserID   *uuid.UUID `json:"user_id" gorm:"type:uuid"`
	IsPublic bool       `json:"isPublic" gorm:"default:true;not null"`
}

type RecipeIngredient struct {
	RecipeID         uuid.UUID  `json:"recipe_id" gorm:"type:uuid;primaryKey"`
	IngredientID     int        `json:"ingredient_id" gorm:"primaryKey"`
	QuantityRequired int        `json:"quantity_required"`
	Ingredient       Ingredient `json:"ingredient" gorm:"foreignKey:IngredientID;references:ID"`
}
