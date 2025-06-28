package models

import (
	"github.com/google/uuid"
)

type UserIngredientDefault struct {
	UserID          uuid.UUID `json:"user_id"`
	IngredientID    int       `json:"ingredient_id"`
	DefaultQuantity int       `json:"default_quantity"`
}

func (UserIngredientDefault) TableName() string {
	return "user_ingredient_defaults"
}
