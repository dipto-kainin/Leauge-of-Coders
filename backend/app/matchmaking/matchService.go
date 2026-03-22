package matchmaking

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/config"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"
)

type MatchService struct {
	db          *gorm.DB
	redisClient *redis.Client
	hub         *Hub
}

func NewMatchService(db *gorm.DB, hub *Hub) *MatchService {
	return &MatchService{
		db:          db,
		redisClient: config.RedisClient,
		hub:         hub,
	}
}

// CreateMatch creates a match between two players
func (s *MatchService) CreateMatch(ctx context.Context, p1ID, p2ID uuid.UUID) error {
	var p1, p2 models.User
	if err := s.db.First(&p1, "id = ?", p1ID).Error; err != nil {
		return err
	}
	if err := s.db.First(&p2, "id = ?", p2ID).Error; err != nil {
		return err
	}

	avgMMR := (p1.MMR + p2.MMR) / 2
	difficulty := "easy"
	if avgMMR >= 1400 {
		difficulty = "hard"
	} else if avgMMR >= 1100 {
		difficulty = "medium"
	}

	// Select a random problem from the difficulty tier
	var problem models.Problem
	// In PostgreSQL, ORDER BY RANDOM() requires fetching all or limit.
	if err := s.db.Where("difficulty = ?", difficulty).Order("RANDOM()").First(&problem).Error; err != nil {
        // Fallback if no problem of that difficulty exists
        if err := s.db.Order("RANDOM()").First(&problem).Error; err != nil {
            return fmt.Errorf("could not find a problem for the match: %w", err)
        }
	}

	now := time.Now()
	match := models.Match{
		Player1ID: p1ID,
		Player2ID: p2ID,
		ProblemID: problem.ID,
		Status:    "in_progress",
		StartedAt: &now,
	}

	if err := s.db.Create(&match).Error; err != nil {
		return err
	}

	// Store match ephemeral state in Redis
	s.redisClient.Set(ctx, fmt.Sprintf("match:%s:p1_passed", match.ID.String()), 0, 35*time.Minute)
	s.redisClient.Set(ctx, fmt.Sprintf("match:%s:p2_passed", match.ID.String()), 0, 35*time.Minute)

	// Broadcast match_found via WS
	s.hub.Broadcast(match.ID, WSEvent{
		Type: "match_found",
		Payload: map[string]interface{}{
			"match_id": match.ID,
			"problem":  problem,
		},
	})

	// Start a goroutine for the 30-min timer
	time.AfterFunc(30*time.Minute, func() {
		s.ForceFinish(context.Background(), match.ID)
	})

	return nil
}

// EvaluateWin checks if a player has won
func (s *MatchService) EvaluateWin(ctx context.Context, matchID, submitterID uuid.UUID, testsPassed, testsTotal int) error {
	var match models.Match
	if err := s.db.First(&match, "id = ?", matchID).Error; err != nil {
		return err
	}

	if match.Status != "in_progress" {
		return fmt.Errorf("match is not in progress")
	}

	playerPrefix := "p1"
	if submitterID == match.Player2ID {
		playerPrefix = "p2"
	}

	s.redisClient.Set(ctx, fmt.Sprintf("match:%s:%s_passed", matchID.String(), playerPrefix), testsPassed, 35*time.Minute)

	if testsPassed == testsTotal && testsTotal > 0 {
		// Use Redis lock to prevent race conditions during simultaneous solves
		lockKey := fmt.Sprintf("match:%s:lock", matchID.String())
		ok, err := s.redisClient.SetNX(ctx, lockKey, 1, 5*time.Second).Result()
		if err == nil && ok {
			s.FinishMatch(ctx, matchID, &submitterID)
		}
	} else {
		// Broadcast progress
		s.hub.Broadcast(matchID, WSEvent{
			Type: "opponent_submitted",
			Payload: map[string]interface{}{
				"submitter_id": submitterID,
				"tests_passed": testsPassed,
				"tests_total":  testsTotal,
			},
		})
	}

	return nil
}

// ForceFinish resolves the match when time expires
func (s *MatchService) ForceFinish(ctx context.Context, matchID uuid.UUID) {
	// Lock the match processing
	lockKey := fmt.Sprintf("match:%s:lock", matchID.String())
	ok, err := s.redisClient.SetNX(ctx, lockKey, 1, 5*time.Second).Result()
	if err != nil || !ok {
		return
	}

	var match models.Match
	if err := s.db.First(&match, "id = ?", matchID).Error; err != nil {
		return
	}

	if match.Status != "in_progress" {
		return
	}

	p1PassedStr, _ := s.redisClient.Get(ctx, fmt.Sprintf("match:%s:p1_passed", matchID.String())).Result()
	p2PassedStr, _ := s.redisClient.Get(ctx, fmt.Sprintf("match:%s:p2_passed", matchID.String())).Result()

	var p1Passed, p2Passed int
	fmt.Sscanf(p1PassedStr, "%d", &p1Passed)
	fmt.Sscanf(p2PassedStr, "%d", &p2Passed)

	if p1Passed > p2Passed {
		s.FinishMatch(ctx, matchID, &match.Player1ID)
	} else if p2Passed > p1Passed {
		s.FinishMatch(ctx, matchID, &match.Player2ID)
	} else {
		// Draw
		s.FinishMatch(ctx, matchID, nil)
	}
}

func (s *MatchService) updatePlayerStats(db *gorm.DB, p *models.User, newMMR int) error {
    p.MMR = newMMR
    p.MatchesPlayed++
    // Since we don't track total wins easily here, this is a simplified win rate update
    // In reality you should queries standard match table.
    // For simplicity, we just save the MMR and MatchesPlayed. User winrate logic can be aggregated later.
    return db.Save(p).Error
}

// FinishMatch calculates elo, points, saves results, broadcasts
func (s *MatchService) FinishMatch(ctx context.Context, matchID uuid.UUID, winnerID *uuid.UUID) {
	var match models.Match
	// Preload problem and players
	if err := s.db.Preload("Problem").Preload("Player1").Preload("Player2").First(&match, "id = ?", matchID).Error; err != nil {
		log.Printf("error fetching finish match: %v", err)
		return
	}

	if match.Status != "in_progress" {
		return
	}

	now := time.Now()
	match.Status = "finished"
	match.EndedAt = &now
	match.WinnerID = winnerID

    // Calculate MMR changes
    K := 32.0
    
    calcElo := func(mmrA, mmrB int) float64 {
        return 1.0 / (1.0 + math.Pow(10, float64(mmrB-mmrA)/400.0))
    }
    
    e1 := calcElo(match.Player1.MMR, match.Player2.MMR)
    e2 := calcElo(match.Player2.MMR, match.Player1.MMR)
    
    var s1, s2 float64
    if winnerID == nil {
        s1, s2 = 0.5, 0.5 // Draw
    } else if *winnerID == match.Player1ID {
        s1, s2 = 1.0, 0.0 // P1 wins
    } else {
        s1, s2 = 0.0, 1.0 // P2 wins
    }

    delta1 := int(K * (s1 - e1))
    delta2 := int(K * (s2 - e2))

    // DB Transaction for match finish
    err := s.db.Transaction(func(tx *gorm.DB) error {
        if err := tx.Save(&match).Error; err != nil {
            return err
        }
        
        match.Player1.MMR += delta1
        match.Player1.MatchesPlayed++
        if s1 == 1.0 { // P1 is winner, updating winrate basic
            match.Player1.WinRate = ((match.Player1.WinRate * float64(match.Player1.MatchesPlayed-1)) + 1) / float64(match.Player1.MatchesPlayed)
        } else {
            match.Player1.WinRate = (match.Player1.WinRate * float64(match.Player1.MatchesPlayed-1)) / float64(match.Player1.MatchesPlayed)
        }

        match.Player2.MMR += delta2
        match.Player2.MatchesPlayed++
        if s2 == 1.0 { // P2 is winner
            match.Player2.WinRate = ((match.Player2.WinRate * float64(match.Player2.MatchesPlayed-1)) + 1) / float64(match.Player2.MatchesPlayed)
        } else {
            match.Player2.WinRate = (match.Player2.WinRate * float64(match.Player2.MatchesPlayed-1)) / float64(match.Player2.MatchesPlayed)
        }
        
        if err := tx.Save(&match.Player1).Error; err != nil {
            return err
        }
        if err := tx.Save(&match.Player2).Error; err != nil {
            return err
        }

        return nil
    })

    if err != nil {
        log.Printf("error saving match result: %v", err)
        return
    }

    // Points calculation for winner
    pointsAwarded := 0
    if winnerID != nil {
        // Points = Base * (0.5 + 0.5 * SuccessRate) (rough approximation of plan)
        successRate := match.Problem.SuccessRate
        if successRate == 0 {
            successRate = 1.0 // Prevent 0 case
        }
        pointsAwarded = int(float64(match.Problem.PointValue) * (0.5 + 0.5*successRate))
    }

	s.hub.Broadcast(matchID, WSEvent{
		Type: "match_result",
		Payload: map[string]interface{}{
			"winner_id":      winnerID,
             "points_awarded": pointsAwarded,
			"player1_delta":  delta1,
			"player2_delta":  delta2,
             "player1_mmr":    match.Player1.MMR,
             "player2_mmr":    match.Player2.MMR,
		},
	})
    
    // Slight delay before closing hub to ensure clients receive msg
    time.AfterFunc(3 * time.Second, func() {
	    s.hub.Close(matchID)
    })
}
