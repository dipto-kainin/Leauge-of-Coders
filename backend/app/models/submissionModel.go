package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type Submission struct {
	ID          uuid.UUID `json:"id" gorm:"type:uuid;primaryKey;default:uuid_generate_v4()"`
	CreatedAt   time.Time `json:"created_at"`

	MatchID     uuid.UUID `json:"match_id" gorm:"type:uuid;not null"`
	UserID      uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`

	Code        string    `json:"code" gorm:"type:text;not null"`
	Language    string    `json:"language" gorm:"type:varchar(30);not null"`
	TestsPassed int       `json:"tests_passed" gorm:"not null;default:0"`
	TestsTotal  int       `json:"tests_total" gorm:"not null;default:0"`
	Status      string    `json:"status" gorm:"type:varchar(20);check:status IN ('pending','accepted','wrong_answer','error','timeout')"`
	SubmittedAt time.Time `json:"submitted_at"`

	// Relations omitted from JSON to avoid empty zero-value blobs.
	// MatchID and UserID are the FK references; join via API if needed.
	Match Match `json:"-" gorm:"foreignKey:MatchID"`
	User  User  `json:"-" gorm:"foreignKey:UserID"`
}

func (s *Submission) BeforeCreate(tx *gorm.DB) (err error) {
	if s.ID == uuid.Nil {
		s.ID = uuid.New()
	}
	if s.SubmittedAt.IsZero() {
		s.SubmittedAt = time.Now()
	}
	return nil
}
