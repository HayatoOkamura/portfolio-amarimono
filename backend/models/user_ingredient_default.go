package models

import (
	"time"
)

type UserIngredientDefault struct {
	ID           int        `json:"id" gorm:"primaryKey"`
	UserID       UUIDString `json:"user_id"`
	IngredientID int        `json:"ingredient_id"`
	Quantity     float64    `json:"quantity"`
	UnitID       int        `json:"unit_id"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (UserIngredientDefault) TableName() string {
	return "user_ingredient_defaults"
}
