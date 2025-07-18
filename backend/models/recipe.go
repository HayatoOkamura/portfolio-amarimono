package models

import (
	"time"
)

type Recipe struct {
	ID                  UUIDString         `json:"id" gorm:"type:uuid;primary_key;default:uuid_generate_v4()"`
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
	UserID              *UUIDString        `json:"user_id" gorm:"type:uuid"`
	IsPublic            bool               `json:"is_public" gorm:"default:true"`
	IsDraft             bool               `json:"is_draft" gorm:"default:false"`
	NutritionPercentage map[string]float64 `json:"nutrition_percentage,omitempty" gorm:"-"`
	CreatedAt           time.Time          `json:"created_at"`
	UpdatedAt           time.Time          `json:"updated_at"`
}

type RecipeIngredient struct {
	RecipeID         UUIDString `json:"recipe_id" gorm:"type:uuid;primaryKey"`
	IngredientID     int        `json:"ingredient_id" gorm:"primaryKey"`
	QuantityRequired float64    `json:"quantity_required"`
	UnitID           int        `json:"unit_id" gorm:"foreignKey:UnitID;references:ID"`
	Ingredient       Ingredient `json:"ingredient" gorm:"foreignKey:IngredientID;references:ID"`
	Unit             Unit       `json:"unit" gorm:"foreignKey:UnitID;references:ID"`
}
