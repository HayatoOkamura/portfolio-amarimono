package models

// JWTClaims JWTトークンのクレーム情報を保持する構造体
type JWTClaims struct {
	Sub string `json:"sub"`
}
