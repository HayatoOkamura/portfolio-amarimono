package models

// AddIngredientRequest リクエストボディ用の構造体
type AddIngredientRequest struct {
	Name           string  `json:"name" binding:"required"`
	GenreID        int     `json:"genre_id" binding:"required"`
	UnitID         int     `json:"unit_id" binding:"required"`
	Nutrition      string  `json:"nutrition"`
	GramEquivalent float64 `json:"gram_equivalent" binding:"required"`
}
