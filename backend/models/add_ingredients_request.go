package models

// AddIngredientRequest リクエストボディ用の構造体
type AddIngredientRequest struct {
	Name  string `json:"name" binding:"required"`
	Genre struct {
		ID   int    `json:"id" binding:"required"`
		Name string `json:"name" binding:"required"`
	} `json:"genre" binding:"required"`
	ImageUrl string `json:"imageUrl"`
}
