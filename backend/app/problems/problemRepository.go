package problems

import (
	"strconv"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ProblemRepository interface {
	CreateProblem(problem *models.Problem) error
	GetProblemByID(id uuid.UUID) (*models.Problem, error)
	GetProblemBySlug(slug string) (*models.Problem, error)
	UpdateProblem(problem *models.Problem) error
	DeleteProblem(id uuid.UUID) error
	GetAllProblems(page string, limit string) ([]models.Problem, error)
	ReplaceTestCases(problemID uuid.UUID, testCases []models.TestCase) error
	ReplaceModerators(problem *models.Problem, moderators []models.User) error
}

type problemRepository struct {
	db *gorm.DB
}

func NewProblemRepository(db *gorm.DB) ProblemRepository {
	return &problemRepository{db: db}
}

func (r *problemRepository) CreateProblem(problem *models.Problem) error {
	return r.db.Create(problem).Error
}

func (r *problemRepository) GetProblemByID(id uuid.UUID) (*models.Problem, error) {
	var problem models.Problem
	err := r.db.Preload("Moderators").Preload("TestCases").First(&problem, "id = ?", id).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

func (r *problemRepository) GetProblemBySlug(slug string) (*models.Problem, error) {
	var problem models.Problem
	err := r.db.Preload("Moderators").Preload("TestCases").First(&problem, "slug = ?", slug).Error
	if err != nil {
		return nil, err
	}
	return &problem, nil
}

func (r *problemRepository) GetAllProblems(page string, limit string) ([]models.Problem, error) {
	pageNum, err := strconv.Atoi(page)
	if err != nil || pageNum < 1 {
		pageNum = 1
	}
	limitNum, err := strconv.Atoi(limit)
	if err != nil || limitNum < 1 || limitNum > 100 {
		limitNum = 10
	}
	offset := (pageNum - 1) * limitNum

	var problems []models.Problem
	// Moderators are preloaded for display; TestCases are NOT needed for the list view
	err = r.db.Preload("Moderators").
		Offset(offset).
		Limit(limitNum).
		Find(&problems).Error
	if err != nil {
		return nil, err
	}
	return problems, nil
}

func (r *problemRepository) UpdateProblem(problem *models.Problem) error {
	return r.db.Session(&gorm.Session{FullSaveAssociations: true}).Save(problem).Error
}

func (r *problemRepository) DeleteProblem(id uuid.UUID) error {
	return r.db.Select("TestCases").Delete(&models.Problem{ID: id}).Error
}

func (r *problemRepository) ReplaceTestCases(problemID uuid.UUID, testCases []models.TestCase) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// Delete old test cases for this problem
		if err := tx.Where("problem_id = ?", problemID).Delete(&models.TestCase{}).Error; err != nil {
			return err
		}
		// Insert the new set
		if len(testCases) > 0 {
			for i := range testCases {
				testCases[i].ProblemID = problemID
			}
			return tx.Create(&testCases).Error
		}
		return nil
	})
}

func (r *problemRepository) ReplaceModerators(problem *models.Problem, moderators []models.User) error {
	return r.db.Model(problem).Association("Moderators").Replace(moderators)
}
