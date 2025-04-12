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
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to scan JSONBFaq: expected []byte, got %T", value)
	}

	// 空の値の場合は空の配列を返す
	if len(bytes) == 0 || string(bytes) == "null" {
		*f = JSONBFaq{}
		return nil
	}

	// 配列形式の場合はそのままアンマーシャリング
	if bytes[0] == '[' {
		return json.Unmarshal(bytes, f)
	}

	// オブジェクト形式の場合は配列に変換
	if bytes[0] == '{' {
		var singleFAQ FAQ
		if err := json.Unmarshal(bytes, &singleFAQ); err != nil {
			return err
		}
		*f = JSONBFaq{singleFAQ}
		return nil
	}

	return fmt.Errorf("invalid FAQ format: %s", string(bytes))
}

func (f JSONBFaq) Value() (driver.Value, error) {
	return json.Marshal(f)
}
