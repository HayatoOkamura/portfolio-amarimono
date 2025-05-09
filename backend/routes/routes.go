package routes

import (
	"portfolio-amarimono/handlers"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(router *gin.Engine, recipeHandler *handlers.RecipeHandler, likeHandler *handlers.LikeHandler, userHandler *handlers.UserHandler, genreHandler *handlers.GenreHandler, adminHandler *handlers.AdminHandler, reviewHandler *handlers.ReviewHandler, recommendationHandler *handlers.RecommendationHandler) {
	// いいね機能のエンドポイント
	router.POST("/api/likes/:user_id/:recipe_id", likeHandler.ToggleUserLike) // レシピにいいねを追加
	router.GET("/api/likes/:user_id", likeHandler.GetUserLikes)               // ユーザーのお気に入りレシピを取得

	// `/api/recipes` エンドポイントの登録
	router.POST("/api/recipes", recipeHandler.SerchRecipes)              // レシピ検索
	router.GET("/api/recipes/:id", recipeHandler.GetRecipeByID)          // レシピ詳細を取得
	router.GET("/api/recipes/search", recipeHandler.SearchRecipesByName) // レシピ名付検索

	// `/api/recommendations` エンドポイントの登録
	router.GET("/api/recommendations/:user_id", recommendationHandler.GetRecommendedRecipes)

	// ユーザー登録エンドポイント
	router.POST("/api/users", userHandler.CreateUser)
	router.GET("/api/users/:id", userHandler.GetUserProfile)
	router.PUT("/api/users/:id", userHandler.UpdateUserProfile)
	router.GET("/api/users/:id/likes", userHandler.GetUserLikeCount) // ユーザーの投稿レシピの合計いいね数を取得
	router.GET("/api/users/:id/reviews", userHandler.GetUserRecipeAverageRating)
	router.GET("/api/user/recipes", recipeHandler.GetUserRecipes) // 特定のレシピ取得

	// ジャンル取得エンドポイント
	router.GET("/api/recipe_genres", genreHandler.ListRecipeGenres)
	router.GET("/api/ingredient_genres", genreHandler.ListIngredientGenres)

	// レビュー関連のルーティング
	router.POST("/api/reviews", reviewHandler.AddReview)                       // レビュー追加
	router.GET("/api/reviews/:recipe_id", reviewHandler.GetReviewsByRecipeID)  // レシピのレビュー取得
	router.GET("/api/reviews/user/:user_id", reviewHandler.GetReviewsByUserID) // ユーザーのレビュー取得
	router.PUT("/api/reviews/:id", reviewHandler.UpdateReview)                 // レビュー更新
	router.DELETE("/api/reviews/:id", reviewHandler.DeleteReview)              // レビュー削除

	// 管理画面用エンドポイント
	admin := router.Group("/admin")
	{
		admin.GET("/ingredients", adminHandler.ListIngredients)                   // 具材一覧
		admin.POST("/ingredients", adminHandler.AddIngredient)                    // 具材追加
		admin.PATCH("/ingredients/:id", adminHandler.UpdateIngredient)            // 具材更新
		admin.DELETE("/ingredients/:id", adminHandler.DeleteIngredient)           // 具材削除
		admin.GET("/ingredients/translate", adminHandler.TranslateIngredientName) // 具材名の翻訳
		admin.GET("/recipes", adminHandler.ListRecipes)                           // レシピ一覧
		admin.GET("/recipes/:id", adminHandler.GetRecipe)                         // レシピ取得
		admin.POST("/recipes", adminHandler.AddRecipe)                            // レシピ追加
		admin.PUT("/recipes/:id", adminHandler.UpdateRecipe)                      // レシピ更新
		admin.DELETE("/recipes/:id", adminHandler.DeleteRecipe)                   // レシピ削除
		admin.PUT("/recipes/:id/toggle-publish", adminHandler.ToggleRecipePublish) // レシピの公開/非公開を切り替え
		admin.GET("/units", adminHandler.ListUnits)                               // 単位一覧
		admin.POST("/draft-recipes", adminHandler.SaveDraftRecipe)                // 下書きレシピの保存
		admin.GET("/draft-recipes/:userId", adminHandler.GetDraftRecipes)         // 下書きレシピの取得
	}
}
