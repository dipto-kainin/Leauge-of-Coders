package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TestCase struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey;type:uuid;default:uuid_generate_v4()"`
	ProblemID uuid.UUID `json:"problem_id" gorm:"type:uuid;not null"`
	Input     string    `json:"input" gorm:"type:text;not null"`
	Output    string    `json:"output" gorm:"type:text;not null"`
	Points    int       `json:"points" gorm:"not null"`
	IsExample bool      `json:"is_example" gorm:"not null;default:false"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (tc *TestCase) BeforeCreate(tx *gorm.DB) (err error) {
	if tc.ID == uuid.Nil {
		tc.ID = uuid.New()
	}
	return nil
}
