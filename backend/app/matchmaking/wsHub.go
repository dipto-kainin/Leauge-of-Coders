package matchmaking

import (
	"sync"

	"github.com/google/uuid"
	"github.com/gorilla/websocket"
)

type WSEvent struct {
	Type    string      `json:"type"` // match_found | tick | opponent_submitted | match_result
	Payload interface{} `json:"payload"`
}

type Hub struct {
	// Map matchID to a pair of connections (Player 1 and Player 2)
	rooms map[uuid.UUID]*[2]*websocket.Conn
	mu    sync.RWMutex
}

func NewHub() *Hub {
	return &Hub{
		rooms: make(map[uuid.UUID]*[2]*websocket.Conn),
	}
}

// Register adds a connection to the match room
func (h *Hub) Register(matchID uuid.UUID, playerIndex int, conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[matchID]
	if !exists {
		room = &[2]*websocket.Conn{}
		h.rooms[matchID] = room
	}

	room[playerIndex] = conn
}

// Broadcast sends an event to all connected players in the match
func (h *Hub) Broadcast(matchID uuid.UUID, event WSEvent) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	room, exists := h.rooms[matchID]
	if !exists {
		return
	}

	for _, conn := range room {
		if conn != nil {
			// WriteJSON is not safe for concurrent use on a single connection, 
            // but we are writing to each connection sequentially here.
			// Still lock for safety if multiple broadcasts occur simultaneously.
			conn.WriteJSON(event)
		}
	}
}

// Close removes the match room
func (h *Hub) Close(matchID uuid.UUID) {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[matchID]
	if !exists {
		return
	}

	for _, conn := range room {
		if conn != nil {
			conn.Close()
		}
	}

	delete(h.rooms, matchID)
}

// RemoveConnection removes a specific connection from the room (e.g. on disconnect)
func (h *Hub) RemoveConnection(matchID uuid.UUID, playerIndex int) {
	h.mu.Lock()
	defer h.mu.Unlock()

	room, exists := h.rooms[matchID]
	if !exists {
		return
	}

	room[playerIndex] = nil
}
