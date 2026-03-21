package auth

import (
	"errors"
	"strings"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"gorm.io/gorm"
)

type AuthRepository interface {
	CreateUser(user *models.User) error
	GetUserByEmail(email string) (*models.User, error)
	GetUserByID(id string) (*models.User, error)
	ExistsByEmail(email string) (bool, error)
	GetUserByGoogleSub(sub string) (*models.User, error)
}

type authRepository struct {
	db *gorm.DB
}

func NewAuthRepository(db *gorm.DB) AuthRepository {
	return &authRepository{db: db}
}

func (r *authRepository) CreateUser(user *models.User) error {
	return r.db.Create(user).Error
}

func (r *authRepository) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	result := r.db.Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}

	// Extra safety: if rows affected is 0, user genuinely doesn't exist
	if result.RowsAffected == 0 {
		return nil, nil
	}

	return &user, nil
}

func (r *authRepository) GetUserByID(id string) (*models.User, error) {
	var user models.User
	result := r.db.Where("id = ?", id).First(&user)

	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}

	if result.RowsAffected == 0 {
		return nil, nil
	}

	return &user, nil
}

func (r *authRepository) ExistsByEmail(email string) (bool, error) {
	var count int64
	err := r.db.Model(&models.User{}).
		Where("LOWER(email) = ?", strings.ToLower(strings.TrimSpace(email))).
		Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *authRepository) GetUserByGoogleSub(sub string) (*models.User, error) {
	var user models.User
	result := r.db.Where("google_sub = ?", sub).First(&user)
	if result.Error != nil {
		if errors.Is(result.Error, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, result.Error
	}
	return &user, nil
}
