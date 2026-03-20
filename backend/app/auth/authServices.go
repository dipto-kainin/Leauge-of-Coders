package auth

import (
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/lib"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials  = errors.New("invalid email or password")
	ErrEmailAlreadyUsed    = errors.New("email is already in use")
	ErrUsernameAlreadyUsed = errors.New("username is already in use")
	ErrInvalidToken        = errors.New("invalid or expired token")
)

type Service struct {
	repo AuthRepository
}

type RegisterInput struct {
	Username string `json:"username"`
	Email    string `json:"email"`
	Password string `json:"password"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken string `json:"accessToken"`
	TokenType   string `json:"tokenType"`
	ExpiresIn   int64  `json:"expiresIn"`
	User        MeUser `json:"user"`
}

type MeUser struct {
	ID       uuid.UUID `json:"id"`
	Username string    `json:"username"`
	Email    string    `json:"email"`
	Role     string    `json:"role"`
	Method   string    `json:"method"`
}

type AuthClaims struct {
	UserID uuid.UUID `json:"uid"`
	Role   string    `json:"role"`
	jwt.RegisteredClaims
}

func NewService(repo AuthRepository) *Service {
	return &Service{repo: repo}
}

func (s *Service) Register(input RegisterRequest) (*AuthResponse, error) {
	if input.Username == "" || input.Email == "" || input.Password == "" {
		return nil, errors.New("username, email and password are required")
	}

	// Fix: check the returned user, not just the error
	existingEmail, err := s.repo.GetUserByEmail(input.Email)
	if err != nil {
		return nil, fmt.Errorf("failed checking email uniqueness: %w", err)
	}
	if existingEmail != nil {
		return nil, ErrEmailAlreadyUsed
	}

	existingUsername, err := s.repo.GetUserByUsername(input.Username)
	if err != nil {
		return nil, fmt.Errorf("failed checking username uniqueness: %w", err)
	}
	if existingUsername != nil {
		return nil, ErrUsernameAlreadyUsed
	}

	// rest of the function stays the same...
	hash, err := lib.HashPassword(input.Password)
	if err != nil {
		return nil, fmt.Errorf("failed hashing password: %w", err)
	}

	user := &models.User{
		Username:     input.Username,
		Email:        input.Email,
		PasswordHash: hash,
		Role:         models.RoleUser,
		Method:       models.MethodLocal,
	}

	if err := s.repo.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed creating user: %w", err)
	}

	return s.issueToken(user)
}

func (s *Service) Login(input LoginRequest) (*AuthResponse, error) {
	if input.Email == "" || input.Password == "" {
		return nil, errors.New("email and password are required")
	}

	user, err := s.repo.GetUserByEmail(input.Email)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidCredentials
		}
		return nil, fmt.Errorf("failed loading user: %w", err)
	}

	if !lib.CheckPasswordHash(input.Password, user.PasswordHash) {
		return nil, ErrInvalidCredentials
	}

	return s.issueToken(user)
}

func (s *Service) Me(userID uuid.UUID) (*MeResponse, error) {
	user, err := s.repo.GetUserByID(userID.String())
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, fmt.Errorf("failed loading user: %w", err)
	}
	if user == nil {
		return nil, ErrInvalidToken
	}

	return &MeResponse{
		User: UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
			Method:   user.Method,
		},
	}, nil
}

func (s *Service) ParseAccessToken(tokenString string) (*AuthClaims, error) {
	return s.parseToken(tokenString)
}

func (s *Service) issueToken(user *models.User) (*AuthResponse, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, errors.New("JWT_SECRET is not configured")
	}

	exp := time.Now().Add(24 * time.Hour)
	claims := AuthClaims{
		UserID: user.ID,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   user.ID.String(),
			ExpiresAt: jwt.NewNumericDate(exp),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "Leauge-of-Coders",
		},
	}

	tkn := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := tkn.SignedString([]byte(secret))
	if err != nil {
		return nil, fmt.Errorf("failed signing token: %w", err)
	}

	return &AuthResponse{
		Token: signed,
		User: UserDTO{
			ID:       user.ID,
			Username: user.Username,
			Email:    user.Email,
			Role:     user.Role,
			Method:   user.Method,
		},
	}, nil
}

func (s *Service) parseToken(tokenString string) (*AuthClaims, error) {
	secret := os.Getenv("JWT_SECRET")
	if secret == "" {
		return nil, errors.New("JWT_SECRET is not configured")
	}

	claims := &AuthClaims{}
	parsed, err := jwt.ParseWithClaims(tokenString, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, ErrInvalidToken
		}
		return []byte(secret), nil
	})
	if err != nil || !parsed.Valid {
		return nil, ErrInvalidToken
	}

	return claims, nil
}
