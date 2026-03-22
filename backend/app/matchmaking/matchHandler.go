package matchmaking

import (
	"net/http"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type MatchHandler struct {
	db                *gorm.DB
	matchService      *MatchService
	submissionService *SubmissionService
}

func NewMatchHandler(db *gorm.DB, matchService *MatchService, submissionService *SubmissionService) *MatchHandler {
	return &MatchHandler{
		db:                db,
		matchService:      matchService,
		submissionService: submissionService,
	}
}

type SubmitRequest struct {
	Code     string `json:"code" binding:"required"`
	Language string `json:"language" binding:"required"`
}

// Submit code for a match
func (h *MatchHandler) Submit(c *gin.Context) {
	matchIDStr := c.Param("id")
	matchID, err := uuid.Parse(matchIDStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid match id"})
		return
	}

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

	var req SubmitRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	submission, err := h.submissionService.Submit(c.Request.Context(), matchID, userID, req.Code, req.Language)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submission)
}

// GetMatch gets match details
func (h *MatchHandler) Get(c *gin.Context) {
	matchID := c.Param("id")

	var match models.Match
	if err := h.db.Preload("Problem").Preload("Player1").Preload("Player2").First(&match, "id = ?", matchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "match not found"})
		return
	}

	c.JSON(http.StatusOK, match)
}

// ListSubmissions lists submissions for the calling user in a specific match
func (h *MatchHandler) Submissions(c *gin.Context) {
	matchID := c.Param("id")
	userIDRaw, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}
    // We already have uuid.UUID but need it as string for the DB query 
    // Wait, the DB query uses Where("user_id = ?", userIDStr).
    // I can just pass the userIDRaw or formatting it.
    userID, ok := userIDRaw.(uuid.UUID)
    if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid user id"})
		return
    }

	var submissions []models.Submission
	if err := h.db.Where("match_id = ? AND user_id = ?", matchID, userID).Order("submitted_at DESC").Find(&submissions).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, submissions)
}
