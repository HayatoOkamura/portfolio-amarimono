package models

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

type InstructionStep struct {
	StepNumber  int    `json:"stepNumber"`
	Description string `json:"description"`
}

type JSONBInstructions []InstructionStep

func (j *JSONBInstructions) Scan(value interface{}) error {
	bytes, ok := value.([]byte)
	if !ok {
		return fmt.Errorf("failed to scan JSONBInstructions: expected []byte, got %T", value)
	}
	return json.Unmarshal(bytes, j)
}

func (j JSONBInstructions) Value() (driver.Value, error) {
	return json.Marshal(j)
}
