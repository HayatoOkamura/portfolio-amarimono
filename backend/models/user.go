package models

import (
	"time"

	"gorm.io/gorm"
)

// User ユーザーモデル
type User struct {
	ID           string     `json:"id" gorm:"primaryKey"`
	Email        string     `json:"email" gorm:"unique;not null"`
	Username     *string    `json:"username"`
	Age          *int       `json:"age"`
	Gender       *string    `json:"gender"`
	ProfileImage *string    `json:"profile_image"`
	Role         string     `json:"role" gorm:"-"` // データベースには保存しないが、JSONには含める
	CreatedAt    time.Time  `json:"created_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	UpdatedAt    time.Time  `json:"updated_at" gorm:"not null;default:CURRENT_TIMESTAMP"`
	DeletedAt    *time.Time `json:"deleted_at" gorm:"index"`
}

// TableName テーブル名を指定
func (User) TableName() string {
	return "users"
}

// CreateUser ユーザーを作成する
func CreateUser(db *gorm.DB, user *User) error {
	return db.Create(user).Error
}

// GetUserByID IDからユーザーを取得する
func GetUserByID(db *gorm.DB, id string) (*User, error) {
	var user User
	err := db.First(&user, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &user, nil
}

// UpdateUser ユーザー情報を更新する
func UpdateUser(db *gorm.DB, user *User) error {
	return db.Save(user).Error
}

// DeleteUser ユーザーを削除する
func DeleteUser(db *gorm.DB, id string) error {
	return db.Delete(&User{}, "id = ?", id).Error
}
