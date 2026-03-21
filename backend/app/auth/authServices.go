package auth

import (
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/lib"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/config"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/oauth2"
	"gorm.io/gorm"
)

var (
	ErrInvalidCredentials = errors.New("invalid email or password")
	ErrEmailAlreadyUsed   = errors.New("email is already in use")
	ErrInvalidToken       = errors.New("invalid or expired token")
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

func (s *Service) GoogleAuthURL() (url string, state string, err error) {
	b := make([]byte, 16)
	if _, err = rand.Read(b); err != nil {
		return
	}
	state = base64.URLEncoding.EncodeToString(b)
	url = config.GoogleOAuthConfig().AuthCodeURL(state, oauth2.AccessTypeOffline)
	return
}

type googleUserInfo struct {
	Sub   string `json:"sub"`
	Email string `json:"email"`
	Name  string `json:"name"`
}

func (s *Service) GoogleRegister(code string) (*AuthResponse, error) {
	cfg := config.GoogleOAuthConfig()
	token, err := cfg.Exchange(context.Background(), code)
	if err != nil {
		return nil, fmt.Errorf("failed exchanging code: %w", err)
	}
	client := cfg.Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v3/userinfo")
	if err != nil {
		return nil, fmt.Errorf("failed fetching user info: %w", err)
	}
	defer resp.Body.Close()
	body, _ := io.ReadAll(resp.Body)
	var info googleUserInfo
	if err := json.Unmarshal(body, &info); err != nil {
		return nil, fmt.Errorf("failed parsing user info: %w", err)
	}
	user, err := s.repo.GetUserByGoogleSub(info.Sub)
	if err != nil {
		return nil, fmt.Errorf("failed looking up user: %w", err)
	}
	if user == nil {
		existing, err := s.repo.GetUserByEmail(info.Email)
		if err != nil {
			return nil, fmt.Errorf("failed checking email: %w", err)
		}
		if existing != nil {
			return nil, errors.New("email already registered with a password account")
		}

		user = &models.User{
			Username:  info.Name,
			Email:     info.Email,
			GoogleSub: &info.Sub,
			Role:      models.RoleUser,
			Method:    models.MethodGoogle,
		}
		if err := s.repo.CreateUser(user); err != nil {
			return nil, fmt.Errorf("failed creating user: %w", err)
		}
	}
	return s.issueToken(user)
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
