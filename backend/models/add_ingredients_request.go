package models

// AddIngredientRequest リクエストボディ用の構造体
type AddIngredientRequest struct {
	Name        string `json:"name" binding:"required"`
	EnglishName string `json:"english_name" binding:"required"`
	Genre       struct {
		ID   int    `json:"id" binding:"required"`
		Name string `json:"name" binding:"required"`
	} `json:"genre" binding:"required"`
	ImageUrl  string        `json:"imageUrl"`
	UnitID    int           `json:"unit_id" binding:"required"`
	Nutrition NutritionInfo `json:"nutrition"`
}
