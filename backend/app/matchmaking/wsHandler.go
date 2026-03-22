package matchmaking

import (
	"log"
	"net/http"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/gorilla/websocket"
	"gorm.io/gorm"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		// Allow all origins for now. In prod, strict check.
		return true
	},
}

type WSHandler struct {
	db  *gorm.DB
	hub *Hub
}

func NewWSHandler(db *gorm.DB, hub *Hub) *WSHandler {
	return &WSHandler{
		db:  db,
		hub: hub,
	}
}

// Connect endpoint for WebSocket
func (h *WSHandler) Connect(c *gin.Context) {
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

	var match models.Match
	if err := h.db.First(&match, "id = ?", matchID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "match not found"})
		return
	}

	playerIndex := 0
	if userID == match.Player2ID {
		playerIndex = 1
	} else if userID != match.Player1ID {
		c.JSON(http.StatusForbidden, gin.H{"error": "not a participant in this match"})
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Println("upgrade err:", err)
		return
	}

	h.hub.Register(matchID, playerIndex, conn)

	// Keep alive loop
	defer func() {
		h.hub.RemoveConnection(matchID, playerIndex)
		conn.Close()
	}()

	for {
		_, _, err := conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("error: %v", err)
			}
			break
		}
	}
}
