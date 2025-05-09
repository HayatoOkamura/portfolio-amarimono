package models

import (
	"time"

	"github.com/google/uuid"
)

type Recipe struct {
	ID                  uuid.UUID          `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
	Name                string             `json:"name" binding:"required"`
	Instructions        JSONBInstructions  `json:"instructions" gorm:"type:jsonb" binding:"required"`
	MainImage           string             `json:"image_url" gorm:"column:image_url"`
	GenreID             int                `json:"genre_id" binding:"required"`
	Genre               RecipeGenre        `json:"genre" gorm:"foreignKey:GenreID;references:ID"`
	Ingredients         []RecipeIngredient `json:"ingredients" gorm:"foreignKey:RecipeID;references:ID" binding:"required,dive"`
	Reviews             []Review           `json:"reviews" gorm:"foreignKey:RecipeID;references:ID"`
	CookingTime         int                `json:"cooking_time"`
	CostEstimate        int                `json:"cost_estimate"`
	Summary             string             `json:"summary"`
	Nutrition           NutritionInfo      `json:"nutrition" gorm:"type:jsonb"`
	Catchphrase         string             `json:"catchphrase"`
	FAQ                 JSONBFaq           `json:"faq" gorm:"type:jsonb;default:'[]'"`
	Likes               []Like             `json:"likes"`
	UserID              *uuid.UUID         `json:"user_id" gorm:"type:uuid"`
	IsPublic            bool               `json:"is_public" gorm:"default:true"`
	IsDraft             bool               `json:"is_draft" gorm:"default:false"`
	NutritionPercentage map[string]float64 `json:"nutritionPercentage,omitempty" gorm:"-"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}

type RecipeIngredient struct {
	RecipeID         uuid.UUID  `json:"recipe_id" gorm:"type:uuid;primaryKey"`
	IngredientID     int        `json:"ingredient_id" gorm:"primaryKey"`
	QuantityRequired float64    `json:"quantity_required"`
	Ingredient       Ingredient `json:"ingredient" gorm:"foreignKey:IngredientID;references:ID"`
}
