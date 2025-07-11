package models

import (
	"time"
)

type Review struct {
	ID        UUIDString `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primary_key"`
	RecipeID  UUIDString `json:"recipeId" gorm:"type:uuid;not null"`
	UserID    UUIDString `json:"userId" gorm:"type:uuid;not null"`
	Rating    int        `json:"rating" gorm:"type:int;check:rating >= 1 AND rating <= 5"`
	Comment   string     `json:"comment" gorm:"type:text"`
	CreatedAt time.Time  `json:"createdAt" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time  `json:"updatedAt" gorm:"default:CURRENT_TIMESTAMP"`
}

func (Review) TableName() string {
	return "reviews"
}
