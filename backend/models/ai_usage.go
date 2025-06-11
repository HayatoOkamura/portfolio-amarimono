package models

import "time"

type AIUsage struct {
	ID         uint      `json:"id" gorm:"primaryKey"`
	UserID     string    `json:"user_id"`
	UsageCount int       `json:"usage_count"`
	LastReset  time.Time `json:"last_reset"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

func (AIUsage) TableName() string {
	return "ai_usage"
}
