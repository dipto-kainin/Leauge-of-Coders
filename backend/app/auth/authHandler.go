package auth

import (
	"fmt"
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

type AuthService interface {
	Register(input RegisterRequest) (*AuthResponse, error)
	Login(input LoginRequest) (*AuthResponse, error)
	Me(userID uuid.UUID) (*MeResponse, error)
	GoogleAuthURL() (string, string, error)
	GoogleRegister(code string) (*AuthResponse, error)
}

type AuthHandler struct {
	service AuthService
}

func NewAuthHandler(service AuthService) *AuthHandler {
	return &AuthHandler{
		service: service,
	}
}

type RegisterRequest struct {
	Username        string `json:"username" binding:"required,min=3,max=50"`
	Email           string `json:"email" binding:"required,email,max=255"`
	Password        string `json:"password" binding:"required,min=6,max=100"`
	ConfirmPassword string `json:"confirm_password" binding:"required,min=6,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email,max=255"`
	Password string `json:"password" binding:"required,min=6,max=100"`
}

type AuthResponse struct {
	Token string  `json:"token"`
	User  UserDTO `json:"user"`
}

type MeResponse struct {
	User UserDTO `json:"user"`
}

type UserDTO struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	Method   string    `json:"method"`
}

type errorResponse struct {
	Message string `json:"message"`
}

type queryParams struct {
	Type string `form:"type"`
}

func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "invalid request body"})
		return
	}

	resp, err := h.service.Register(req)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: err.Error()})
		return
	}

	c.SetCookie("token", resp.Token, 3600, "/", "", false, true)

	c.JSON(http.StatusCreated, gin.H{
		"user": resp.User,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "invalid request body"})
		return
	}

	resp, err := h.service.Login(req)
	if err != nil {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: err.Error()})
		return
	}
	c.SetCookie("token", resp.Token, 3600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{
		"user": resp.User,
	})
}

func (h *AuthHandler) Me(c *gin.Context) {
	rawUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: "unauthorized"})
		return
	}

	fmt.Println(rawUserID)

	userID, ok := rawUserID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: "invalid token payload"})
		return
	}

	resp, err := h.service.Me(userID)
	if err != nil {
		c.JSON(http.StatusNotFound, errorResponse{Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, resp)
}

func (h *AuthHandler) Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"message": "logged out"})
}

func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	url, state, err := h.service.GoogleAuthURL()
	if err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Message: "failed generating auth URL"})
		return
	}
	// Store state in a short-lived HttpOnly cookie to validate on callback
	c.SetCookie("oauth_state", state, 600, "/", "", false, true)
	c.JSON(http.StatusOK, gin.H{"url": url})
}

func (h *AuthHandler) GoogleCallback(c *gin.Context) {
	// Validate state to prevent CSRF
	storedState, err := c.Cookie("oauth_state")
	if err != nil || storedState != c.Query("state") {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "invalid state"})
		return
	}
	c.SetCookie("oauth_state", "", -1, "/", "", false, true) // clear it

	code := c.Query("code")
	if code == "" {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "missing code"})
		return
	}

	resp, err := h.service.GoogleRegister(code)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: err.Error()})
		return
	}

	c.SetCookie("token", resp.Token, 3600*24, "/", "", false, true)
	c.Redirect(http.StatusFound, "http://localhost:3000/")
}
