package matchmaking

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
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

// runLocalCode writes the code to a temp file, runs it with the native interpreter, and returns stdout/stderr
func runLocalCode(ctx context.Context, code, language, stdin string) (string, error) {
	// Create a temporary directory for this run
	tmpDir, err := os.MkdirTemp("", "judge_*")
	if err != nil {
		return "", fmt.Errorf("failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tmpDir)

	var cmd *exec.Cmd

	switch language {
	case "go":
		filePath := filepath.Join(tmpDir, "main.go")
		if err := os.WriteFile(filePath, []byte(code), 0644); err != nil {
			return "", err
		}
		cmd = exec.CommandContext(ctx, "go", "run", filePath)
	case "python":
		filePath := filepath.Join(tmpDir, "main.py")
		if err := os.WriteFile(filePath, []byte(code), 0644); err != nil {
			return "", err
		}
		cmd = exec.CommandContext(ctx, "python3", filePath) // Make sure python3 is installed
	case "js":
		filePath := filepath.Join(tmpDir, "main.js")
		if err := os.WriteFile(filePath, []byte(code), 0644); err != nil {
			return "", err
		}
		cmd = exec.CommandContext(ctx, "node", filePath) // Make sure Node.js is installed
	default:
		return "", fmt.Errorf("local execution not supported for language: %s", language)
	}

	// Connect stdin to the test case input
	cmd.Stdin = strings.NewReader(stdin)

	// Capture stdout and stderr
	var outBuf, errBuf bytes.Buffer
	cmd.Stdout = &outBuf
	cmd.Stderr = &errBuf

	// Run the command
	err = cmd.Run()
	if err != nil {
		// Timeouts, compile errors, or runtime panics
		return "", fmt.Errorf("execution error: %v, stderr: %s", err, errBuf.String())
	}

	return outBuf.String(), nil
}

// Submit evaluates the user's code against all test cases for the problem natively on Linux
func (s *SubmissionService) Submit(ctx context.Context, matchID, userID uuid.UUID, code, language string) (*models.Submission, error) {
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

	for _, tc := range testCases {
		// Run each test with a strict 2 second timeout
		timeoutCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
		
		// Unescape literal newlines in DB input
		actualInput := strings.ReplaceAll(tc.Input, `\n`, "\n")
		actualInput = strings.ReplaceAll(actualInput, `\t`, "\t")

		stdout, err := runLocalCode(timeoutCtx, code, language, actualInput)
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

	go func() {
		// Must use background context so evaluate async process isn't cancelled
		err := s.matchService.EvaluateWin(context.Background(), matchID, userID, passed, total)
		if err != nil {
			fmt.Printf("Error evaluating win: %v\n", err)
		}
	}()

	return &submission, nil
}
