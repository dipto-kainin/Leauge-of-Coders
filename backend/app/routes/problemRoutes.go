package routes

import (
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/problems"
	"github.com/gin-gonic/gin"
)

// RegisterProblemRoutes defines problem-related routes.
func RegisterProblemRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc, adminMiddleware gin.HandlerFunc, handler *problems.ProblemHandler) {
	problemGroup := router.Group("/api/problems")
	{
		// Admin-only routes
		problemGroup.POST("", authMiddleware, adminMiddleware, handler.CreateProblem)
		problemGroup.DELETE("/:id", authMiddleware, adminMiddleware, handler.DeleteProblem)
		problemGroup.PUT("/:id", authMiddleware, adminMiddleware, handler.UpdateProblem)

		// Authenticated routes
		problemGroup.GET("", authMiddleware, handler.GetAllProblems)
		problemGroup.GET("/:slug", authMiddleware, handler.GetProblemBySlug)
	}
}
