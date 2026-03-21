package problems

import (
	"errors"
	"fmt"
	"regexp"
	"strings"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/auth"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/google/uuid"
)

var (
	ErrNameRequired           = errors.New("name is required")
	ErrDifficultyRequired     = errors.New("difficulty is required")
	ErrStatementRequired      = errors.New("problem_statement is required")
	ErrInputFormatRequired    = errors.New("input_format is required")
	ErrOutputFormatRequired   = errors.New("output_format is required")
	ErrNeedExampleTestCase    = errors.New("at least one example test case is required")
	ErrNeedPrivateTestCase    = errors.New("at least one private (non-example) test case is required")
	ErrDuplicateTestCase      = errors.New("duplicate test case detected (same input and output)")
	ErrModeratorEmailNotFound = errors.New("moderator email not found")
	ErrInvalidDifficulty      = errors.New("difficulty must be one of: easy, medium, hard")
)

type ProblemService interface {
	CreateProblem(req CreateProblemRequest, creatorID uuid.UUID) (*models.Problem, error)
	GetProblemBySlug(slug string) (*models.Problem, error)
	GetAllProblems(page string, limit string) ([]models.Problem, error)
	DeleteProblem(id uuid.UUID) error
}

type problemService struct {
	repo     ProblemRepository
	userRepo auth.AuthRepository
}

func NewProblemService(repo ProblemRepository, userRepo auth.AuthRepository) ProblemService {
	return &problemService{repo: repo, userRepo: userRepo}
}

// slugify converts a name into a URL-safe slug.
var nonAlphaNum = regexp.MustCompile(`[^a-z0-9-]+`)
var multiDash = regexp.MustCompile(`-{2,}`)

func slugify(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	s = strings.ReplaceAll(s, " ", "-")
	s = nonAlphaNum.ReplaceAllString(s, "")
	s = multiDash.ReplaceAllString(s, "-")
	s = strings.Trim(s, "-")
	return s
}

func (s *problemService) CreateProblem(req CreateProblemRequest, creatorID uuid.UUID) (*models.Problem, error) {
	// --- Validation ---
	if strings.TrimSpace(req.Name) == "" {
		return nil, ErrNameRequired
	}
	if strings.TrimSpace(req.Difficulty) == "" {
		return nil, ErrDifficultyRequired
	}
	validDifficulties := map[string]bool{"easy": true, "medium": true, "hard": true}
	if !validDifficulties[strings.ToLower(req.Difficulty)] {
		return nil, ErrInvalidDifficulty
	}
	if strings.TrimSpace(req.ProblemStatement) == "" {
		return nil, ErrStatementRequired
	}
	if strings.TrimSpace(req.InputFormat) == "" {
		return nil, ErrInputFormatRequired
	}
	if strings.TrimSpace(req.OutputFormat) == "" {
		return nil, ErrOutputFormatRequired
	}

	// Validate test cases: need at least 1 example + 1 private
	hasExample := false
	hasPrivate := false
	seen := make(map[string]bool)

	for _, tc := range req.TestCases {
		// Dedup by input+output
		key := fmt.Sprintf("%s|||%s", tc.Input, tc.Output)
		if seen[key] {
			return nil, ErrDuplicateTestCase
		}
		seen[key] = true

		if tc.IsExample {
			hasExample = true
		} else {
			hasPrivate = true
		}
	}
	if !hasExample {
		return nil, ErrNeedExampleTestCase
	}
	if !hasPrivate {
		return nil, ErrNeedPrivateTestCase
	}

	// --- Resolve moderator emails → User objects ---
	var moderators []models.User
	for _, email := range req.ModeratorEmails {
		user, err := s.userRepo.GetUserByEmail(email)
		if err != nil {
			return nil, fmt.Errorf("error looking up moderator %s: %w", email, err)
		}
		if user == nil {
			return nil, fmt.Errorf("%w: %s", ErrModeratorEmailNotFound, email)
		}
		moderators = append(moderators, *user)
	}

	// --- Build test case models ---
	var testCases []models.TestCase
	for _, tc := range req.TestCases {
		testCases = append(testCases, models.TestCase{
			Input:     tc.Input,
			Output:    tc.Output,
			Points:    tc.Points,
			IsExample: tc.IsExample,
		})
	}

	// --- Build problem model ---
	problem := &models.Problem{
		Name:             strings.TrimSpace(req.Name),
		Description:      req.Description,
		Difficulty:       strings.ToLower(req.Difficulty),
		Slug:             slugify(req.Name),
		ProblemStatement: req.ProblemStatement,
		InputFormat:      req.InputFormat,
		OutputFormat:     req.OutputFormat,
		Constraints:      req.Constraints,
		Moderators:       moderators,
		TestCases:        testCases,
	}

	if err := s.repo.CreateProblem(problem); err != nil {
		return nil, fmt.Errorf("failed creating problem: %w", err)
	}

	return problem, nil
}

func (s *problemService) GetAllProblems(page string, limit string) ([]models.Problem, error) {
	problems, err := s.repo.GetAllProblems(page, limit)
	if err != nil {
		return nil, fmt.Errorf("failed getting problems: %w", err)
	}
	return problems, nil
}

func (s *problemService) GetProblemBySlug(slug string) (*models.Problem, error) {
	problem, err := s.repo.GetProblemBySlug(slug)
	if err != nil {
		return nil, fmt.Errorf("problem not found: %w", err)
	}
	return problem, nil
}

func (s *problemService) DeleteProblem(id uuid.UUID) error {
	if err := s.repo.DeleteProblem(id); err != nil {
		return fmt.Errorf("failed deleting problem: %w", err)
	}
	return nil
}
