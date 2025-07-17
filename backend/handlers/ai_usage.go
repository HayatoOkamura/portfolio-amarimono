package handlers

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"

	"portfolio-amarimono/models"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sashabaranov/go-openai"
	"gorm.io/gorm"
)

type AIUsageHandler struct {
	DB *gorm.DB
}

func NewAIUsageHandler(db *gorm.DB) *AIUsageHandler {
	return &AIUsageHandler{
		DB: db,
	}
}

// モックデータ
var mockDescriptions = map[string]struct {
	Catchphrase string
	Summary     string
}{
	"カレー": {
		Catchphrase: "スパイスの香りが食欲をそそる、定番の家庭料理",
		Summary:     "玉ねぎをじっくり炒めることで甘みが増し、スパイスの風味と絶妙に調和します。具材の旨味が溶け込んだ濃厚なルーは、ご飯が進むこと間違いなし。",
	},
	"親子丼": {
		Catchphrase: "卵と鶏肉の相性が抜群、和食の定番メニュー",
		Summary:     "鶏肉の旨味と卵のまろやかさが絶妙に調和した、日本人なら誰もが大好きな丼物。甘辛いタレがご飯とよく合い、心も体も満たされる一品です。",
	},
	"味噌汁": {
		Catchphrase: "日本の食卓に欠かせない、心を癒す伝統の味",
		Summary:     "出汁の旨味と味噌の香りが広がる、日本人の心のふるさと。具材の組み合わせで無限のバリエーションが楽しめ、毎日飲んでも飽きない味わいです。",
	},
	"ハンバーグ": {
		Catchphrase: "肉汁たっぷり、手作りならではの美味しさ",
		Summary:     "挽肉の旨味を最大限に引き出す、手作りハンバーグ。肉汁が溢れ出すジューシーな食感と、デミグラスソースの深い味わいが絶妙に調和します。",
	},
	"オムライス": {
		Catchphrase: "ふわふわ卵とケチャップライスの絶妙なハーモニー",
		Summary:     "ふわふわの卵と、ケチャップで味付けしたチキンライスが織りなす、子供から大人まで大好きな洋食の定番。見た目も味も大満足の一品です。",
	},
	"ラーメン": {
		Catchphrase: "スープの旨味が染み込む、心も体も温まる一杯",
		Summary:     "長時間煮込んだスープの深い味わいと、麺のコシが絶妙に調和。具材の旨味が溶け込んだ一杯は、疲れた心と体を癒してくれます。",
	},
}

// 開発環境かどうかを判定
func isDevelopment() bool {
	if os.Getenv("ENVIRONMENT") == "development" {
		return true
	}
	return false
}

// GetAIUsage はユーザーのAI使用回数を取得するハンドラー
func (h *AIUsageHandler) GetAIUsage(c *gin.Context) {
	// Authorization ヘッダーからトークンを取得
	authHeader := c.GetHeader("Authorization")
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
	claims := models.JWTClaims{}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	if err := json.Unmarshal(payload, &claims); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	// ユーザーのAI使用回数を取得
	var aiUsage struct {
		UsageCount int `json:"usage_count"`
	}
	if err := h.DB.Table("ai_usage").
		Select("usage_count").
		Where("user_id = ?", claims.Sub).
		First(&aiUsage).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// レコードが存在しない場合は0を返す
			c.JSON(http.StatusOK, gin.H{
				"usage_count": 0,
				"usage_limit": 10,
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の取得に失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"usage_count": aiUsage.UsageCount,
		"usage_limit": 10,
	})
}

// IncrementAIUsage はユーザーのAI使用回数を増やすハンドラー
func (h *AIUsageHandler) IncrementAIUsage(c *gin.Context) {
	// Authorization ヘッダーからトークンを取得
	authHeader := c.GetHeader("Authorization")
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
	claims := models.JWTClaims{}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	if err := json.Unmarshal(payload, &claims); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	// トランザクションを開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションの開始に失敗しました"})
		return
	}

	// 既存のレコードを確認
	var aiUsage struct {
		ID          models.UUIDString `json:"id"`
		UsageCount  int               `json:"usage_count"`
		LastResetAt time.Time         `json:"last_reset_date"`
	}
	err = tx.Table("ai_usage").
		Where("user_id = ?", claims.Sub).
		First(&aiUsage).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// レコードが存在しない場合は新規作成
			aiUsage = struct {
				ID          models.UUIDString `json:"id"`
				UsageCount  int               `json:"usage_count"`
				LastResetAt time.Time         `json:"last_reset_date"`
			}{
				ID:          models.FromUUID(uuid.New()),
				UsageCount:  1,
				LastResetAt: time.Now(),
			}
			if err := tx.Table("ai_usage").Create(&aiUsage).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の更新に失敗しました"})
				return
			}
		} else {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の取得に失敗しました"})
			return
		}
	} else {
		// 既存のレコードを更新
		if err := tx.Table("ai_usage").
			Where("user_id = ?", claims.Sub).
			Update("usage_count", gorm.Expr("usage_count + 1")).
			Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の更新に失敗しました"})
			return
		}
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションのコミットに失敗しました"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "使用回数を更新しました"})
}

// GenerateDescription はレシピの説明文を生成するハンドラー
func (h *AIUsageHandler) GenerateDescription(c *gin.Context) {
	// Authorization ヘッダーからトークンを取得
	authHeader := c.GetHeader("Authorization")
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
	claims := models.JWTClaims{}
	payload, err := base64.RawURLEncoding.DecodeString(parts[1])
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	if err := json.Unmarshal(payload, &claims); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "無効なトークンです"})
		return
	}

	// リクエストボディからレシピ名を取得
	var requestBody struct {
		RecipeName string `json:"recipe_name" binding:"required"`
	}
	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "レシピ名が必要です"})
		return
	}

	// ユーザーのAI使用回数を確認
	var aiUsage struct {
		UsageCount int `json:"usage_count"`
	}
	recordExists := true
	if err := h.DB.Table("ai_usage").
		Select("usage_count").
		Where("user_id = ?", claims.Sub).
		First(&aiUsage).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			// レコードが存在しない場合は新規作成
			aiUsage.UsageCount = 0
			recordExists = false
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の取得に失敗しました"})
			return
		}
	}

	// 使用回数が上限に達しているかチェック
	if aiUsage.UsageCount >= 10 {
		c.JSON(http.StatusForbidden, gin.H{"error": "AI使用回数の上限に達しました"})
		return
	}

	// トランザクションを開始
	tx := h.DB.Begin()
	if tx.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションの開始に失敗しました"})
		return
	}

	// 使用回数を増やす
	if recordExists {
		// 既存のレコードを更新
		if err := tx.Table("ai_usage").
			Where("user_id = ?", claims.Sub).
			Update("usage_count", gorm.Expr("usage_count + 1")).
			Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の更新に失敗しました"})
			return
		}
	} else {
		// 新規レコードを作成
		if err := tx.Table("ai_usage").Create(map[string]interface{}{
			"user_id":         claims.Sub,
			"usage_count":     1,
			"last_reset_date": time.Now(),
		}).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "使用回数の作成に失敗しました"})
			return
		}
	}

	// トランザクションをコミット
	if err := tx.Commit().Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "トランザクションのコミットに失敗しました"})
		return
	}

	var catchphrase, summary string

	if isDevelopment() {
		// 開発環境ではモックデータを使用
		if mockData, exists := mockDescriptions[requestBody.RecipeName]; exists {
			catchphrase = mockData.Catchphrase
			summary = mockData.Summary
		} else {
			catchphrase = "栄養満点！野菜の甘みが引き立つ、家族みんなが喜ぶ絶品" + requestBody.RecipeName
			summary = requestBody.RecipeName + "は、新鮮な食材を使用し、丁寧に調理することで、素材の旨味を最大限に引き出した一品です。野菜の甘みとスパイスの香りが絶妙に調和し、一度食べたらやみつきになる味わいです。家族みんなで楽しめる、心も体も満たされる料理です。"
		}
	} else {
		// 本番環境ではOpenAI APIを使用
		client := openai.NewClient(os.Getenv("OPENAI_API_KEY"))

		systemPrompt := `あなたは料理の説明文を生成する専門家です。
以下の条件で料理の説明文を生成してください：
1. キャッチフレーズ（30文字以内）：料理の特徴を簡潔に表現
2. 詳細な説明（150文字前後）：材料や調理法、味わいの特徴を具体的に説明

出力形式：
{
  "catchphrase": "キャッチフレーズ",
  "summary": "詳細な説明"
}`

		userPrompt := fmt.Sprintf("「%s」の説明文を生成してください。", requestBody.RecipeName)

		resp, err := client.CreateChatCompletion(
			context.Background(),
			openai.ChatCompletionRequest{
				Model: openai.GPT3Dot5Turbo,
				Messages: []openai.ChatCompletionMessage{
					{
						Role:    openai.ChatMessageRoleSystem,
						Content: systemPrompt,
					},
					{
						Role:    openai.ChatMessageRoleUser,
						Content: userPrompt,
					},
				},
				MaxTokens:   150,
				Temperature: 0.7,
			},
		)

		if err != nil {
			// APIエラー時はモックデータにフォールバック
			if mockData, exists := mockDescriptions[requestBody.RecipeName]; exists {
				catchphrase = mockData.Catchphrase
				summary = mockData.Summary
			} else {
				catchphrase = "栄養満点！野菜の甘みが引き立つ、家族みんなが喜ぶ絶品" + requestBody.RecipeName
				summary = requestBody.RecipeName + "は、新鮮な食材を使用し、丁寧に調理することで、素材の旨味を最大限に引き出した一品です。"
			}
		} else {
			// レスポンスのパース
			var result struct {
				Catchphrase string `json:"catchphrase"`
				Summary     string `json:"summary"`
			}

			if err := json.Unmarshal([]byte(resp.Choices[0].Message.Content), &result); err != nil {
				// パースエラー時はモックデータにフォールバック
				if mockData, exists := mockDescriptions[requestBody.RecipeName]; exists {
					catchphrase = mockData.Catchphrase
					summary = mockData.Summary
				} else {
					catchphrase = "栄養満点！野菜の甘みが引き立つ、家族みんなが喜ぶ絶品" + requestBody.RecipeName
					summary = requestBody.RecipeName + "は、新鮮な食材を使用し、丁寧に調理することで、素材の旨味を最大限に引き出した一品です。"
				}
			} else {
				catchphrase = result.Catchphrase
				summary = result.Summary
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"catchphrase": catchphrase,
		"summary":     summary,
	})
}
