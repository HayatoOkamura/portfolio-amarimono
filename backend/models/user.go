package models

import (
	"log"
	"strings"
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
	log.Printf("🔍 CreateUser - Creating user with ID: %s", user.ID)
	err := db.Create(user).Error
	if err != nil {
		log.Printf("🔍 CreateUser - Error creating user: %v", err)
	} else {
		log.Printf("🔍 CreateUser - User created successfully: %s", user.ID)
	}
	return err
}

// GetUserByID IDからユーザーを取得する
func GetUserByID(db *gorm.DB, id string) (*User, error) {
	log.Printf("🔍 GetUserByID - Searching for user with ID: %s", id)
	var user User

	// リトライ機能付きでクエリを実行
	var err error
	for retry := 0; retry < 5; retry++ {
		// 新しいセッションでクエリを実行
		tx := db.Session(&gorm.Session{
			PrepareStmt:            false,
			SkipDefaultTransaction: true,
		})

		err = tx.First(&user, "id = ?", id).Error
		if err == nil {
			log.Printf("🔍 GetUserByID - User found: %s", user.ID)
			return &user, nil
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (err.Error() == "ERROR: prepared statement \"stmtcache_\" already exists (SQLSTATE 42P05)" ||
			strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			log.Printf("🔍 GetUserByID - Prepared statement error, retrying... (attempt %d/5)", retry+1)
			time.Sleep(200 * time.Millisecond) // 待機時間を増加
			continue
		}

		break
	}

	log.Printf("🔍 GetUserByID - Error finding user: %v", err)
	return nil, err
}

// UpdateUser ユーザー情報を更新する
func UpdateUser(db *gorm.DB, user *User) error {
	log.Printf("🔍 UpdateUser - Updating user with ID: %s", user.ID)

	// リトライ機能付きでクエリを実行
	var err error
	for retry := 0; retry < 5; retry++ {
		// 新しいセッションでクエリを実行
		tx := db.Session(&gorm.Session{
			PrepareStmt:            false,
			SkipDefaultTransaction: true,
		})

		err = tx.Save(user).Error
		if err == nil {
			log.Printf("🔍 UpdateUser - User updated successfully: %s", user.ID)
			return nil
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (err.Error() == "ERROR: prepared statement \"stmtcache_\" already exists (SQLSTATE 42P05)" ||
			strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			log.Printf("🔍 UpdateUser - Prepared statement error, retrying... (attempt %d/5)", retry+1)
			time.Sleep(200 * time.Millisecond) // 待機時間を増加
			continue
		}

		break
	}

	log.Printf("🔍 UpdateUser - Error updating user: %v", err)
	return err
}

// DeleteUser ユーザーを削除する
func DeleteUser(db *gorm.DB, id string) error {
	log.Printf("🔍 DeleteUser - Deleting user with ID: %s", id)
	err := db.Delete(&User{}, "id = ?", id).Error
	if err != nil {
		log.Printf("🔍 DeleteUser - Error deleting user: %v", err)
	} else {
		log.Printf("🔍 DeleteUser - User deleted successfully: %s", id)
	}
	return err
}
