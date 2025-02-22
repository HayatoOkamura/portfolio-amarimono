package db

import (
	"portfolio-amarimono/models"
)

type RecipeWithIngredients struct {
	Recipe      models.Recipe       `json:"recipe"`
	Ingredients []models.Ingredient `json:"ingredients"`
}

