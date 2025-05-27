package models

import (
	"time"

	"gorm.io/gorm"
)

// User モデル
type User struct {
	ID           string     `gorm:"primaryKey" json:"id"`
	Email        string     `gorm:"not null;unique" json:"email"`
	Username     *string    `json:"username" gorm:"type:varchar(255)"`
	ProfileImage *string    `json:"profile_image" gorm:"type:varchar(255)"`
	Age          *int       `json:"age" gorm:"type:integer"`
	Gender       *string    `json:"gender" gorm:"type:varchar(10)"`
	CreatedAt    time.Time  `json:"created_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

// TableName テーブル名を指定
func (User) TableName() string {
	return "users"
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

// UpdateUser ユーザー情報を更新
func UpdateUser(db *gorm.DB, user User) error {
	if err := db.Save(&user).Error; err != nil {
		return err
	}
	return nil
}

// DeleteUser ユーザーを削除（論理削除）
func DeleteUser(db *gorm.DB, userID string) error {
	if err := db.Delete(&User{}, "id = ?", userID).Error; err != nil {
		return err
	}
	return nil
}
