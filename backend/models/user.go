package models

import "gorm.io/gorm"

// User モデル
type User struct {
	ID    string `gorm:"primaryKey" json:"id"`
	Email string `json:"email"`
}

// CreateUser ユーザーをデータベースに登録
func CreateUser(db *gorm.DB, user User) error {
	if err := db.Create(&user).Error; err != nil {
		return err
	}
	return nil
}
