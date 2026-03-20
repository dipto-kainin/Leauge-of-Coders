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
