package models

import (
	"fmt"
	"log"
	"runtime"
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

// getCallerInfo は呼び出し元の情報を取得する
func getCallerInfo() string {
	pc, file, line, ok := runtime.Caller(2) // 2つ前の呼び出し元を取得
	if !ok {
		return "unknown"
	}
	fn := runtime.FuncForPC(pc)
	if fn == nil {
		return "unknown"
	}
	// ファイル名からディレクトリ部分を除去
	parts := strings.Split(file, "/")
	fileName := parts[len(parts)-1]
	return fmt.Sprintf("%s:%d %s", fileName, line, fn.Name())
}

// CreateUser ユーザーを新規作成する（同期処理は含まない）
func CreateUser(db *gorm.DB, user *User) error {
	log.Printf("🔍 CreateUser - Creating new user with ID: %s", user.ID)
	log.Printf("🔍 CreateUser - Called from: %s", getCallerInfo())
	err := db.Create(user).Error
	if err != nil {
		log.Printf("🔍 CreateUser - Error creating user: %v", err)
	} else {
		log.Printf("🔍 CreateUser - User created successfully: %s", user.ID)
	}
	return err
}

// SyncUser ユーザー情報を同期する（存在しない場合は作成、存在する場合は更新）
func SyncUser(db *gorm.DB, user *User) error {
	log.Printf("🔍 SyncUser - Syncing user with ID: %s", user.ID)
	log.Printf("🔍 SyncUser - Called from: %s", getCallerInfo())

	// 既存のユーザーを確認
	existingUser, err := GetUserByID(db, user.ID)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			log.Printf("🔍 SyncUser - User not found, creating new user: %s", user.ID)
			// ユーザーが存在しない場合は新規作成
			err = CreateUser(db, user)
			if err != nil {
				// 重複キーエラーの場合、ユーザーが既に作成されている
				if strings.Contains(err.Error(), "duplicate key value violates unique constraint") {
					log.Printf("🔍 SyncUser - Duplicate key error, user already exists: %s", user.ID)
					// 既存のユーザーを再取得
					existingUser, err = GetUserByID(db, user.ID)
					if err != nil {
						log.Printf("🔍 SyncUser - Error retrieving existing user: %v", err)
						return err
					}
					// 既存のユーザー情報で更新
					*user = *existingUser
					log.Printf("🔍 SyncUser - User retrieved successfully: %s", user.ID)
					return nil
				}
				log.Printf("🔍 SyncUser - Error creating user: %v", err)
				return err
			}
			log.Printf("🔍 SyncUser - User created successfully: %s", user.ID)
			return nil
		}
		// その他のエラーの場合
		log.Printf("🔍 SyncUser - Error checking existing user: %v", err)
		return err
	}

	log.Printf("🔍 SyncUser - Existing user found, updating: %s", existingUser.ID)

	// ユーザーが既に存在する場合は更新
	user.CreatedAt = existingUser.CreatedAt // 作成日時は保持
	return UpdateUser(db, user)
}

// GetUserByID IDからユーザーを取得する（純粋な取得のみ、同期処理は含まない）
func GetUserByID(db *gorm.DB, id string) (*User, error) {
	log.Printf("🔍 GetUserByID - Searching for user with ID: %s", id)
	log.Printf("🔍 GetUserByID - Called from: %s", getCallerInfo())
	var user User

	// 通常のGORMクエリを使用（prepared statementは無効化済み）
	err := db.Where("id = ? AND deleted_at IS NULL", id).First(&user).Error
	if err == nil {
		log.Printf("🔍 GetUserByID - User found: %s", user.ID)
		return &user, nil
	}

	log.Printf("🔍 GetUserByID - Error finding user: %v", err)
	return nil, err
}

// UpdateUser ユーザー情報を更新する（既存ユーザーの更新のみ）
func UpdateUser(db *gorm.DB, user *User) error {
	log.Printf("🔍 UpdateUser - Updating user with ID: %s", user.ID)

	// 通常のGORMクエリを使用（prepared statementは無効化済み）
	err := db.Model(&User{}).Where("id = ? AND deleted_at IS NULL", user.ID).Updates(map[string]interface{}{
		"email":         user.Email,
		"username":      user.Username,
		"age":           user.Age,
		"gender":        user.Gender,
		"profile_image": user.ProfileImage,
		"updated_at":    time.Now(),
	}).Error

	if err == nil {
		log.Printf("🔍 UpdateUser - User updated successfully: %s", user.ID)
		return nil
	}

	log.Printf("🔍 UpdateUser - Error updating user: %v", err)
	return err
}

// DeleteUser ユーザーを削除する（論理削除）
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
