package models

import (
	"time"

	"github.com/google/uuid"
)

type Review struct {
	ID        uuid.UUID `json:"id" gorm:"type:uuid;default:uuid_generate_v4();primary_key"`
	RecipeID  uuid.UUID `json:"recipeId" gorm:"type:uuid;not null"`
	UserID    uuid.UUID `json:"userId" gorm:"type:uuid;not null"`
	Rating    int       `json:"rating" gorm:"type:int;check:rating >= 1 AND rating <= 5"`
	Comment   string    `json:"comment" gorm:"type:text"`
	CreatedAt time.Time `json:"create_at" gorm:"default:CURRENT_TIMESTAMP"`
	UpdatedAt time.Time `json:"update_at" gorm:"default:CURRENT_TIMESTAMP"`
}

func (Review) TableName() string {
	return "reviews"
}
