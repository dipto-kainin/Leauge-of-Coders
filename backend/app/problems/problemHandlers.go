package problems

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

// --- Request / Response DTOs ---

type CreateProblemRequest struct {
	Name             string            `json:"name" binding:"required"`
	Difficulty       string            `json:"difficulty" binding:"required"`
	Description      string            `json:"description"`
	ProblemStatement string            `json:"problem_statement" binding:"required"`
	InputFormat      string            `json:"input_format" binding:"required"`
	OutputFormat     string            `json:"output_format" binding:"required"`
	Constraints      string            `json:"constraints"`
	ModeratorEmails  []string          `json:"moderator_emails"`
	TestCases        []TestCaseRequest `json:"test_cases" binding:"required,min=1"`
}

type TestCaseRequest struct {
	Input     string `json:"input" binding:"required"`
	Output    string `json:"output" binding:"required"`
	Points    int    `json:"points" binding:"required"`
	IsExample bool   `json:"is_example"`
}

type errorResponse struct {
	Message string `json:"message"`
}

// --- Handler ---

type ProblemHandler struct {
	service ProblemService
}

func NewProblemHandler(service ProblemService) *ProblemHandler {
	return &ProblemHandler{service: service}
}

func (h *ProblemHandler) CreateProblem(c *gin.Context) {
	var req CreateProblemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "invalid request body: " + err.Error()})
		return
	}

	rawUserID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: "unauthorized"})
		return
	}
	creatorID, ok := rawUserID.(uuid.UUID)
	if !ok {
		c.JSON(http.StatusUnauthorized, errorResponse{Message: "invalid token payload"})
		return
	}

	problem, err := h.service.CreateProblem(req, creatorID)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"problem": problem})
}

func (h *ProblemHandler) GetAllProblems(c *gin.Context) {
	page := c.Query("page")
	limit := c.Query("limit")
	if page == "" {
		page = "1"
	}
	if limit == "" {
		limit = "10"
	}
	problems, err := h.service.GetAllProblems(page, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Message: err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"problems": problems})
}

func (h *ProblemHandler) GetProblemBySlug(c *gin.Context) {
	slug := c.Param("slug")
	problem, err := h.service.GetProblemBySlug(slug)
	if err != nil {
		c.JSON(http.StatusNotFound, errorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"problem": problem})
}

func (h *ProblemHandler) DeleteProblem(c *gin.Context) {
	idStr := c.Param("id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Message: "invalid problem ID"})
		return
	}

	if err := h.service.DeleteProblem(id); err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Message: err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "problem deleted"})
}
