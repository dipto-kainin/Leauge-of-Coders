package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Problem struct {
	ID               uuid.UUID `json:"id" gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
	Name             string    `json:"name" gorm:"not null"`
	Description      string    `json:"description" gorm:"type:text"`
	Difficulty       string    `json:"difficulty" gorm:"not null"`
	Slug             string    `json:"slug" gorm:"unique;not null"`
	ProblemStatement string    `json:"problem_statement" gorm:"type:text;not null"`
	InputFormat      string    `json:"input_format" gorm:"type:text;not null"`
	OutputFormat     string    `json:"output_format" gorm:"type:text;not null"`
	Constraints      string    `json:"constraints" gorm:"type:text"`

	// Relationships with correct cascading deletes
	Moderators []User     `json:"moderators" gorm:"many2many:problem_moderators;constraint:OnDelete:CASCADE;"`
	TestCases  []TestCase `json:"test_cases" gorm:"foreignKey:ProblemID;constraint:OnDelete:CASCADE;"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (p *Problem) BeforeCreate(tx *gorm.DB) (err error) {
	if p.ID == uuid.Nil {
		p.ID = uuid.New()
	}
	return nil
}
