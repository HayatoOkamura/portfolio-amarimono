package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

// FAQのJSONB型
type FAQ struct {
	Question string `json:"question"`
	Answer   string `json:"answer"`
}

type JSONBFaq []FAQ

func (f *JSONBFaq) Scan(value interface{}) error {
	if value == nil {
		*f = JSONBFaq{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("failed to scan JSONBFaq: expected []byte or string, got %T", value)
	}

	// 空の値の場合は空の配列を返す
	if len(bytes) == 0 || string(bytes) == "null" {
		*f = JSONBFaq{}
		return nil
	}

	// 配列形式の場合はそのままアンマーシャリング
	if len(bytes) > 0 && bytes[0] == '[' {
		return json.Unmarshal(bytes, f)
	}

	// オブジェクト形式の場合は配列に変換
	if len(bytes) > 0 && bytes[0] == '{' {
		var singleFAQ FAQ
		if err := json.Unmarshal(bytes, &singleFAQ); err != nil {
			return err
		}
		*f = JSONBFaq{singleFAQ}
		return nil
	}

	return fmt.Errorf("invalid FAQ format: %s", string(bytes))
}

// Value はJSONBFaqをデータベースに保存する
func (f JSONBFaq) Value() (driver.Value, error) {
	if f == nil || len(f) == 0 {
		return "[]", nil
	}

	// JSONBとして保存するため、バイト配列を返す
	bytes, err := json.Marshal(f)
	if err != nil {
		return nil, err
	}

	// PreferSimpleProtocol: trueの場合、文字列として返す
	return string(bytes), nil
}
