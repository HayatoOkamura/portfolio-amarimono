package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Like struct {
	ID        string    `gorm:"type:uuid;primaryKey"`
	UserID    string    `gorm:"type:uuid;not null"`
	RecipeID  string    `gorm:"type:uuid;not null"`
	CreatedAt time.Time `gorm:"autoCreateTime"`
}

// BeforeCreate フックを使って UUID を自動生成
func (like *Like) BeforeCreate(tx *gorm.DB) (err error) {
	if like.ID == "" {
		like.ID = uuid.New().String()
	}
	return
}
