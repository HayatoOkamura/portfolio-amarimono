package models

// UnitType represents the type of unit for an ingredient
type UnitType string

const (
	// UnitTypeGram represents weight in grams
	UnitTypeGram UnitType = "gram"
	// UnitTypeMilliliter represents volume in milliliters
	UnitTypeMilliliter UnitType = "milliliter"
	// UnitTypePiece represents count in pieces
	UnitTypePiece UnitType = "piece"
	// UnitTypePresence represents presence/absence of an ingredient
	UnitTypePresence UnitType = "presence"
)

// IsPresenceUnit returns true if the unit type is presence
func (ut UnitType) IsPresenceUnit() bool {
	return ut == UnitTypePresence
}

// GetUnitTypeFromName returns the unit type based on the unit name
func GetUnitTypeFromName(name string) UnitType {
	switch name {
	case "g", "kg":
		return UnitTypeGram
	case "ml", "L":
		return UnitTypeMilliliter
	case "適量":
		return UnitTypePresence
	default:
		return UnitTypePiece
	}
}
