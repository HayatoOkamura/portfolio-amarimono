package models

import (
	"fmt"
	"log"
	"os"
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
			return CreateUser(db, user)
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

	// リトライ機能付きでクエリを実行
	var err error
	for retry := 0; retry < 5; retry++ {
		// より強力なセッション設定（本番環境対応）
		tx := db.Session(&gorm.Session{
			PrepareStmt:              false,
			SkipDefaultTransaction:   true,
			DisableNestedTransaction: true,
			// 本番環境での追加設定
			QueryFields: true,
			// セッション固有の設定
			DryRun: false,
		})

		// 生のSQLクエリを使用してprepared statementを回避
		err = tx.Raw("SELECT id, email, username, age, gender, profile_image, created_at, updated_at, deleted_at FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1", id).Scan(&user).Error
		if err == nil {
			log.Printf("🔍 GetUserByID - User found: %s", user.ID)
			return &user, nil
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			log.Printf("🔍 GetUserByID - Prepared statement error, retrying... (attempt %d/5)", retry+1)
			log.Printf("🔍 GetUserByID - Error details: %v", err)
			log.Printf("🔍 GetUserByID - User ID: %s", id)
			log.Printf("🔍 GetUserByID - Environment: %s", os.Getenv("ENVIRONMENT"))
			log.Printf("🔍 GetUserByID - Host: %s", os.Getenv("SUPABASE_DB_HOST"))
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
	}

	log.Printf("🔍 GetUserByID - Error finding user: %v", err)
	return nil, err
}

// UpdateUser ユーザー情報を更新する（既存ユーザーの更新のみ）
func UpdateUser(db *gorm.DB, user *User) error {
	log.Printf("🔍 UpdateUser - Updating user with ID: %s", user.ID)

	// リトライ機能付きでクエリを実行
	var err error
	for retry := 0; retry < 5; retry++ {
		// より強力なセッション設定（本番環境対応）
		tx := db.Session(&gorm.Session{
			PrepareStmt:              false,
			SkipDefaultTransaction:   true,
			DisableNestedTransaction: true,
			// 本番環境での追加設定
			QueryFields: true,
			// セッション固有の設定
			DryRun: false,
		})

		// 生のSQLクエリを使用してprepared statementを回避
		err = tx.Exec(`
			UPDATE users 
			SET email = ?, username = ?, age = ?, gender = ?, profile_image = ?, updated_at = NOW()
			WHERE id = ? AND deleted_at IS NULL
		`, user.Email, user.Username, user.Age, user.Gender, user.ProfileImage, user.ID).Error

		if err == nil {
			log.Printf("🔍 UpdateUser - User updated successfully: %s", user.ID)
			return nil
		}

		// prepared statementエラーの場合はリトライ
		if retry < 4 && (strings.Contains(err.Error(), "prepared statement") && strings.Contains(err.Error(), "already exists")) {
			log.Printf("🔍 UpdateUser - Prepared statement error, retrying... (attempt %d/5)", retry+1)
			// 待機時間を指数関数的に増加
			waitTime := time.Duration(100*(retry+1)) * time.Millisecond
			time.Sleep(waitTime)
			continue
		}

		break
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
