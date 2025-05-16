package routes

import (
	"portfolio-amarimono/handlers"

	"github.com/gin-gonic/gin"
)

func SetupAuthRoutes(router *gin.Engine, authHandler *handlers.AuthHandler) {
	auth := router.Group("/api/auth")
	{
		auth.GET("/role", authHandler.GetUserRole)
	}
}
