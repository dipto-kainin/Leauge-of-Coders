package matchmaking

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/config"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type SubmissionService struct {
	db           *gorm.DB
	matchService *MatchService
}

func NewSubmissionService(db *gorm.DB, matchService *MatchService) *SubmissionService {
	return &SubmissionService{
		db:           db,
		matchService: matchService,
	}
}

// Helper to get Judge0 Language ID
func getLanguageID(language string) int {
	switch strings.ToLower(language) {
	case "c":
		return 50
	case "c++", "cpp":
		return 54
	case "java":
		return 62
	case "python":
		return 71
	case "go":
		return 60
	default:
		return -1 // Unsupported
	}
}

// Request struct for Judge0
type Judge0Request struct {
	SourceCode string `json:"source_code"`
	LanguageID int    `json:"language_id"`
	Stdin      string `json:"stdin"`
}

// Response struct for Judge0
type Judge0Response struct {
	Stdout  string `json:"stdout"`
	Stderr  string `json:"stderr"`
	Message string `json:"message"`
	Status  struct {
		ID          int    `json:"id"`
		Description string `json:"description"`
	} `json:"status"`
}

// runJudge0Code sends the code to local Judge0 API and returns stdout or error
func runJudge0Code(ctx context.Context, code, language, stdin string) (string, error) {
	langID := getLanguageID(language)
	if langID == -1 {
		return "", fmt.Errorf("local execution not supported for language: %s", language)
	}

	reqBody := Judge0Request{
		SourceCode: code,
		LanguageID: langID,
		Stdin:      stdin,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return "", fmt.Errorf("failed to marshal judge0 request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", "http://localhost:2358/submissions?base64_encoded=false&wait=true", bytes.NewBuffer(jsonData))
	if err != nil {
		return "", fmt.Errorf("failed to create judge0 request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("judge0 request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusCreated && resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("judge0 returned non-200 status: %d", resp.StatusCode)
	}

	var judgeResp Judge0Response
	if err := json.NewDecoder(resp.Body).Decode(&judgeResp); err != nil {
		return "", fmt.Errorf("failed to decode judge0 response: %w", err)
	}

	if judgeResp.Status.ID != 3 { // 3 means Accepted
		// If it's a compile error or something else, return stderr or message
		errDetails := judgeResp.Stderr
		if errDetails == "" {
			errDetails = judgeResp.Message
		}
		if errDetails == "" {
			errDetails = judgeResp.Status.Description
		}
		return "", fmt.Errorf("execution error: %s", errDetails)
	}

	return judgeResp.Stdout, nil
}

// Submit evaluates the user's code against all test cases for the problem natively on Linux
func (s *SubmissionService) Submit(ctx context.Context, matchID, userID uuid.UUID, code, language string) (*models.Submission, error) {
	// Check Redis rate limit
	rateLimitKey := fmt.Sprintf("submission_rate_limit:%s", userID.String())
	exists, err := config.RedisClient.Exists(ctx, rateLimitKey).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to check rate limit: %w", err)
	}
	if exists > 0 {
		return nil, fmt.Errorf("rate limit exceeded: please wait 2 minutes")
	}

	// Set rate limit for 2 minutes
	if err := config.RedisClient.Set(ctx, rateLimitKey, "1", 2*time.Minute).Err(); err != nil {
		return nil, fmt.Errorf("failed to set rate limit: %w", err)
	}

	var match models.Match
	if err := s.db.Preload("Problem").Preload("Problem.TestCases").First(&match, "id = ?", matchID).Error; err != nil {
		return nil, fmt.Errorf("match not found: %w", err)
	}

	if match.Status != "in_progress" {
		return nil, fmt.Errorf("match is not in progress")
	}

	if match.StartedAt == nil || time.Since(*match.StartedAt) > 30*time.Minute {
		return nil, fmt.Errorf("match time has expired")
	}

	// We only check for basic language string now, language id map isn't needed
	testCases := match.Problem.TestCases
	passed := 0
	total := len(testCases)

	passedPoints := 0
	totalPoints := 0

	for _, tc := range testCases {
		if !tc.IsExample {
			totalPoints += tc.Points
		}

		// Run each test with a 5 second timeout (includes Judge0 networking overhead)
		timeoutCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
		
		// Unescape literal newlines in DB input
		actualInput := strings.ReplaceAll(tc.Input, `\n`, "\n")
		actualInput = strings.ReplaceAll(actualInput, `\t`, "\t")

		stdout, err := runJudge0Code(timeoutCtx, code, language, actualInput)
		cancel() // Free timeout resources

		if err != nil {
			fmt.Printf("[Local-Judge] Test FAIL (err): %v\n", err)
			continue
		}

		// Trim whitespace before comparing
		expected := strings.TrimSpace(strings.ReplaceAll(tc.Output, `\n`, "\n"))
		actual := strings.TrimSpace(stdout)
		
		fmt.Printf("[Local-Judge] Got: %q | Expected: %q | Match: %v\n", actual, expected, actual == expected)
		if actual == expected {
			passed++
			if !tc.IsExample {
				passedPoints += tc.Points
			}
		}
	}

	finalStatus := "wrong_answer"
	if passed == total && total > 0 {
		finalStatus = "accepted"
	}

	submission := models.Submission{
		MatchID:     matchID,
		UserID:      userID,
		Code:        code,
		Language:    language,
		TestsPassed: passed,
		TestsTotal:  total,
		Status:      finalStatus,
	}

	if err := s.db.Create(&submission).Error; err != nil {
		return nil, err
	}

	// Must evaluate synchronously so websocket message is sent before HTTP response returns.
	err = s.matchService.EvaluateWin(ctx, matchID, userID, passed, total, passedPoints, totalPoints)
	if err != nil {
		fmt.Printf("Error evaluating win: %v\n", err)
	}

	return &submission, nil
}
