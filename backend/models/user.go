package models

import "gorm.io/gorm"

// User モデル
type User struct {
	ID           string `gorm:"primaryKey" json:"id"`
	Email        string `json:"email"`
	Username     string `json:"username"`
	ProfileImage string `json:"profileImage"`
	Age          string `json:"age"`
	Gender       string `json:"gender"`
}

// CreateUser ユーザーをデータベースに登録
func CreateUser(db *gorm.DB, user User) error {
	if err := db.Create(&user).Error; err != nil {
		return err
	}
	return nil
}

// GetUserByID ユーザーIDでユーザーを取得
func GetUserByID(db *gorm.DB, userID string) (*User, error) {
	var user User
	if err := db.First(&user, "id = ?", userID).Error; err != nil {
		return nil, err
	}
	return &user, nil
}
