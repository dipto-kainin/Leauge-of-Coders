package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Match struct {
	ID        uuid.UUID      `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"-" gorm:"index"`

	Player1ID uuid.UUID  `json:"player1_id" gorm:"type:uuid;not null"`
	Player2ID uuid.UUID  `json:"player2_id" gorm:"type:uuid;not null"`
	ProblemID uuid.UUID  `json:"problem_id" gorm:"type:uuid;not null"`
	WinnerID  *uuid.UUID `json:"winner_id" gorm:"type:uuid"`

	Status    string     `json:"status" gorm:"type:varchar(20);default:'waiting';check:status IN ('waiting','in_progress','finished','cancelled')"`
	StartedAt *time.Time `json:"started_at"`
	EndedAt   *time.Time `json:"ended_at"`

	// Relations
	Player1 User    `json:"player1" gorm:"foreignKey:Player1ID"`
	Player2 User    `json:"player2" gorm:"foreignKey:Player2ID"`
	Winner  *User   `json:"winner" gorm:"foreignKey:WinnerID"`
	Problem Problem `json:"problem" gorm:"foreignKey:ProblemID"`
}

func (m *Match) BeforeCreate(tx *gorm.DB) (err error) {
	if m.ID == uuid.Nil {
		m.ID = uuid.New()
	}
	return nil
}
