package routes

import (
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/matchmaking"
	"github.com/gin-gonic/gin"
)

func RegisterMatchmakingRoutes(router *gin.Engine, authMiddleware gin.HandlerFunc, queueHandler *matchmaking.QueueHandler, matchHandler *matchmaking.MatchHandler, wsHandler *matchmaking.WSHandler) {
	api := router.Group("/api")
	
	// Queue routes
	queue := api.Group("/queue")
	queue.Use(authMiddleware)
	{
		queue.POST("/join", queueHandler.Join)
		queue.DELETE("/leave", queueHandler.Leave)
		queue.GET("/status", queueHandler.Status)
	}

	// Match routes
	match := api.Group("/match")
	match.Use(authMiddleware)
	{
		match.GET("/:id", matchHandler.Get)
		match.POST("/:id/submit", matchHandler.Submit)
		match.GET("/:id/submissions", matchHandler.Submissions)
	}

	// WebSocket route
	ws := api.Group("/ws")
	// Note: Authentication for WebSockets is trickier because JS WebSocket API doesn't support custom headers.
	// You might need to authenticate via ticket query param or handle it inside the connection handler.
    // Assuming simple middleware query parsing or ignoring strictly if front passes it in cookies. 
    // We apply authMiddleware. If it fails due to no header, you must adapt it to allow token in query string.
	ws.Use(authMiddleware)
	{
		ws.GET("/match/:id", wsHandler.Connect)
	}
}
