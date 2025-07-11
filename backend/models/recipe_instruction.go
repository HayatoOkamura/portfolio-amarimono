package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type InstructionStep struct {
	StepNumber  int    `json:"stepNumber"`
	Description string `json:"description"`
	ImageURL    string `json:"image_url,omitempty"`
}

type JSONBInstructions []InstructionStep

func (j *JSONBInstructions) Scan(value interface{}) error {
	if value == nil {
		*j = JSONBInstructions{}
		return nil
	}

	var bytes []byte
	switch v := value.(type) {
	case []byte:
		bytes = v
	case string:
		bytes = []byte(v)
	default:
		return fmt.Errorf("failed to scan JSONBInstructions: expected []byte or string, got %T", value)
	}

	// 空の値の場合は空の配列を返す
	if len(bytes) == 0 || string(bytes) == "null" {
		*j = JSONBInstructions{}
		return nil
	}

	return json.Unmarshal(bytes, j)
}

// Value はJSONBInstructionsをデータベースに保存する
func (j JSONBInstructions) Value() (driver.Value, error) {
	if j == nil || len(j) == 0 {
		return "[]", nil
	}

	// JSONBとして保存するため、バイト配列を返す
	bytes, err := json.Marshal(j)
	if err != nil {
		return nil, err
	}

	// PreferSimpleProtocol: trueの場合、文字列として返す
	return string(bytes), nil
}
