package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"

	"github.com/google/uuid"
)

// JSONB はJSONBデータを安全に扱うためのカスタム型
type JSONB map[string]interface{}

// Scan はデータベースからJSONBデータを読み込む
func (j *JSONB) Scan(value interface{}) error {
	if value == nil {
		*j = nil
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("invalid type for JSONB: %T", value)
	}

	// 空文字列の場合は空のマップを設定
	if len(bytes) == 0 || string(bytes) == "null" {
		*j = make(JSONB)
		return nil
	}

	return json.Unmarshal(bytes, j)
}

// Value はJSONBデータをデータベースに保存する
func (j JSONB) Value() (driver.Value, error) {
	if j == nil {
		return "{}", nil
	}

	// JSONBとして保存するため、バイト配列を返す
	bytes, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}

	// PreferSimpleProtocol: trueの場合、文字列として返す
	return string(bytes), nil
}

// String はJSONBを文字列として表現
func (j JSONB) String() string {
	if j == nil {
		return "{}"
	}
	bytes, _ := json.Marshal(j)
	return string(bytes)
}

// UUIDString はUUIDを文字列として扱うためのカスタム型
type UUIDString uuid.UUID

// Scan はデータベースからUUIDを読み込む
func (u *UUIDString) Scan(value interface{}) error {
	if value == nil {
		*u = UUIDString(uuid.Nil)
		return nil
	}

	switch v := value.(type) {
	case []byte:
		// PreferSimpleProtocol: trueの場合、バイト配列がUUIDのバイト表現の場合がある
		if len(v) == 16 {
			// 16バイトの場合はUUIDのバイト表現として処理
			parsed, err := uuid.ParseBytes(v)
			if err != nil {
				return err
			}
			*u = UUIDString(parsed)
		} else {
			// それ以外の場合は文字列として処理
			parsed, err := uuid.Parse(string(v))
			if err != nil {
				return err
			}
			*u = UUIDString(parsed)
		}
	case string:
		parsed, err := uuid.Parse(v)
		if err != nil {
			return err
		}
		*u = UUIDString(parsed)
	default:
		return fmt.Errorf("invalid type for UUID: %T", value)
	}
	return nil
}

// Value はUUIDをデータベースに保存する
func (u UUIDString) Value() (driver.Value, error) {
	if u == UUIDString(uuid.Nil) {
		return nil, nil
	}

	// PreferSimpleProtocol: trueの場合、文字列として返す
	// これにより、UUIDがバイト配列ではなく文字列として処理される
	return uuid.UUID(u).String(), nil
}

// String はUUIDを文字列として表現
func (u UUIDString) String() string {
	return uuid.UUID(u).String()
}

// ToUUID はUUIDStringをuuid.UUIDに変換
func (u UUIDString) ToUUID() uuid.UUID {
	return uuid.UUID(u)
}

// FromUUID はuuid.UUIDからUUIDStringを作成
func FromUUID(id uuid.UUID) UUIDString {
	return UUIDString(id)
}

// MarshalJSON はUUIDStringをJSONとしてシリアライズする
func (u UUIDString) MarshalJSON() ([]byte, error) {
	if u == UUIDString(uuid.Nil) {
		return []byte("null"), nil
	}
	return json.Marshal(uuid.UUID(u).String())
}

// UnmarshalJSON はJSONからUUIDStringをデシリアライズする
func (u *UUIDString) UnmarshalJSON(data []byte) error {
	if string(data) == "null" {
		*u = UUIDString(uuid.Nil)
		return nil
	}

	var str string
	if err := json.Unmarshal(data, &str); err != nil {
		return err
	}

	parsed, err := uuid.Parse(str)
	if err != nil {
		return err
	}

	*u = UUIDString(parsed)
	return nil
}
