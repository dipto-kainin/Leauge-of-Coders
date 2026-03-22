package matchmaking

import (
	"net/http"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type QueueHandler struct {
	queueService *QueueService
	db           *gorm.DB
}

func NewQueueHandler(queueService *QueueService, db *gorm.DB) *QueueHandler {
	return &QueueHandler{
		queueService: queueService,
		db:           db,
	}
}

// Join the matchmaking queue
func (h *QueueHandler) Join(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

    // Get user MMR. Typically you would fetch the user from DB to get current MMR.
    // Assuming we have access to context or we injected user repo in the handler, 
    // but for now, we'll try to get it from Gin context if middleware sets it, or default to 1000.
    // In a real app, you should query the DB for the user's latest MMR.
    userInteface, exists := c.Get("user")
    var mmr int = 1000
    if exists {
        user, ok := userInteface.(*models.User)
        if ok {
            mmr = user.MMR
        }
    }

	if err := h.queueService.JoinQueue(c.Request.Context(), userID, mmr); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	position, _ := h.queueService.GetQueuePosition(c.Request.Context(), userID)

	c.JSON(http.StatusOK, gin.H{
		"status": "queued",
		"queuePosition": position,
	})
}

// Leave the matchmaking queue
func (h *QueueHandler) Leave(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	if err := h.queueService.LeaveQueue(c.Request.Context(), userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"status": "left"})
}

// Status check for queue — also surfaces an active match_id if matchmaker already paired this player
func (h *QueueHandler) Status(c *gin.Context) {
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	userID, ok := userIDRaw.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
	}

	// Check if user already has an active match (matched but not yet redirected)
	var activeMatch models.Match
	err := h.db.Where(
		"(player1_id = ? OR player2_id = ?) AND status = ?",
		userID, userID, "in_progress",
	).Order("created_at DESC").First(&activeMatch).Error
	if err == nil {
		// User has been matched — tell the frontend to redirect
		c.JSON(http.StatusOK, gin.H{
			"status":   "matched",
			"match_id": activeMatch.ID,
		})
		return
	}

	position, err := h.queueService.GetQueuePosition(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"status": "not_in_queue"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"status":        "queued",
		"queuePosition": position,
	})
}
