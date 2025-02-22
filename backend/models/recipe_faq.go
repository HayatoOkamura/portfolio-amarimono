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
	return json.Unmarshal(bytes, f)
}

func (f JSONBFaq) Value() (driver.Value, error) {
	return json.Marshal(f)
}
