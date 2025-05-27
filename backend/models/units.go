package models

type Unit struct {
	ID          uint     `gorm:"primaryKey" json:"id"`
	Name        string   `gorm:"unique;not null" json:"name"`
	Description string   `gorm:"not null" json:"description"`
	Step        float64  `gorm:"not null;default:1" json:"step"`
	Type        UnitType `gorm:"not null;default:'quantity'" json:"type"`
}
