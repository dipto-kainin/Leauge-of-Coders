package routes

import (
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/auth"
	"github.com/gin-gonic/gin"
)

// RegisterAuthRoutes defines auth routes for register, login, and protected me endpoint.
func RegisterAuthRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc, handler *auth.AuthHandler) {
	authGroup := router.Group("/api/auth")
	{
		authGroup.POST("/register", handler.Register)
		authGroup.POST("/login", handler.Login)
		authGroup.GET("/me", authMiddleware, handler.Me)
		authGroup.POST("/logout", authMiddleware, handler.Logout)

		authGroup.GET("/google/login", handler.GoogleLogin)
		authGroup.GET("/google/callback", handler.GoogleCallback)
	}
}
