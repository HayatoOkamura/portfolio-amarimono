package handlers

import (
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	supa "github.com/supabase-community/supabase-go"
	"gorm.io/gorm"
)

type AuthHandler struct {
	supabase *supa.Client
	db       *gorm.DB
}

func NewAuthHandler(supabase *supa.Client, db *gorm.DB) *AuthHandler {
	return &AuthHandler{
		supabase: supabase,
		db:       db,
	}
}

type JWTClaims struct {
	Sub string `json:"sub"`
}

// GetUserRole ユーザーのロール情報を取得するハンドラー
func (h *AuthHandler) GetUserRole(c *gin.Context) {
	// Authorization ヘッダーからトークンを取得
	authHeader := c.GetHeader("Authorization")

	log.Println("🔥🔥🔥authHeader", authHeader)
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "認証が必要です"})
		return
	}

	// Bearer トークンを抽出
	token := strings.TrimPrefix(authHeader, "Bearer ")
	if token == authHeader {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークン形式です"})
		return
	}

	// JWTトークンを解析
	parts := strings.Split(token, ".")
	if len(parts) != 3 {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークン形式です"})
		return
	}

	// Base64デコードしてJSONを解析
	claims := JWTClaims{}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		log.Printf("Error decoding token: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	if err := json.Unmarshal(payload, &claims); err != nil {
		log.Printf("Error parsing claims: %v", err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	// ユーザーのロール情報を取得
	var userRole struct {
		Role string `json:"role"`
	}
	err = h.db.Table("user_roles").
		Select("role").
		Where("user_id = ?", claims.Sub).
		First(&userRole).Error

	if err != nil {
		// ロールが見つからない場合はデフォルトでuserを返す
		c.JSON(http.StatusOK, gin.H{"role": "user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"role": userRole.Role})
}
