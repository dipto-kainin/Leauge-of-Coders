package matchmaking

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"time"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/config"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const (
	QueueSetKey  = "queue:waiting"
	UserQueueKey = "queue:user:"
)

type QueueService struct {
	redisClient *redis.Client
}

func NewQueueService() *QueueService {
	return &QueueService{
		redisClient: config.RedisClient,
	}
}

// JoinQueue adds a user to the matchmaking queue
func (s *QueueService) JoinQueue(ctx context.Context, userID uuid.UUID, mmr int) error {
	score := float64(mmr)

	// Add to sorted set
	err := s.redisClient.ZAdd(ctx, QueueSetKey, redis.Z{
		Score:  score,
		Member: userID.String(),
	}).Err()
	if err != nil {
		return err
	}

	// Set reverse lookup key with TTL of 10 minutes
	userKey := UserQueueKey + userID.String()
	err = s.redisClient.Set(ctx, userKey, "waiting", 10*time.Minute).Err()
	if err != nil {
		// Attempt to rollback
		s.redisClient.ZRem(ctx, QueueSetKey, userID.String())
		return err
	}

	return nil
}

// LeaveQueue removes a user from the matchmaking queue
func (s *QueueService) LeaveQueue(ctx context.Context, userID uuid.UUID) error {
	// Remove from sorted set
	err := s.redisClient.ZRem(ctx, QueueSetKey, userID.String()).Err()
	if err != nil {
		return err
	}

	// Delete reverse lookup key
	userKey := UserQueueKey + userID.String()
	return s.redisClient.Del(ctx, userKey).Err()
}

// GetQueuePosition returns a user's relative position in the queue, or an error if not in queue
func (s *QueueService) GetQueuePosition(ctx context.Context, userID uuid.UUID) (int64, error) {
	userKey := UserQueueKey + userID.String()
	exists, err := s.redisClient.Exists(ctx, userKey).Result()
	if err != nil {
		return 0, err
	}
	if exists == 0 {
		return 0, fmt.Errorf("user not in queue")
	}

	// For position, we could just return the number of people in the queue or their rank
	rank, err := s.redisClient.ZRank(ctx, QueueSetKey, userID.String()).Result()
	if err != nil {
		if err == redis.Nil {
			return 0, fmt.Errorf("user not found in queue set")
		}
		return 0, err
	}
	// ZRank is 0-indexed, so add 1
	return rank + 1, nil
}

// StartMatchmaker begins the goroutine that matches players together
func (s *QueueService) StartMatchmaker(ctx context.Context, matchCreatedCallback func(p1, p2 uuid.UUID)) {
	ticker := time.NewTicker(2 * time.Second)
	go func() {
		for {
			select {
			case <-ctx.Done():
				ticker.Stop()
				return
			case <-ticker.C:
				s.TryMatch(context.Background(), matchCreatedCallback)
			}
		}
	}()
}

func (s *QueueService) TryMatch(ctx context.Context, matchCreatedCallback func(p1, p2 uuid.UUID)) {
	// Iterate players in queue
	// Basic implementation: fetch all players, or fetch in chunks
	players, err := s.redisClient.ZRangeWithScores(ctx, QueueSetKey, 0, -1).Result()
	if err != nil {
		log.Printf("Error fetching queue: %v", err)
		return
	}

	// For each player, evaluate their wait time and expand MMR search window
	for _, p := range players {
		userIDStr, ok := p.Member.(string)
		if !ok {
			continue
		}

		userKey := UserQueueKey + userIDStr
		ttl, err := s.redisClient.TTL(ctx, userKey).Result()
		if err != nil {
			continue
		}

		// Initial TTL is 10 minutes. 
		// Time waiting = 10m - TTL
		waitTime := 10*time.Minute - ttl

		mmrRange := 150
		if waitTime > 120*time.Second {
			mmrRange = 500
		} else if waitTime > 60*time.Second {
			mmrRange = 300
		}

		minMMR := p.Score - float64(mmrRange)
		maxMMR := p.Score + float64(mmrRange)

		// Look for a candidate
		candidates, err := s.redisClient.ZRangeByScore(ctx, QueueSetKey, &redis.ZRangeBy{
			Min: strconv.FormatFloat(minMMR, 'f', -1, 64),
			Max: strconv.FormatFloat(maxMMR, 'f', -1, 64),
		}).Result()
		
		if err != nil {
			continue
		}

		for _, candidateStr := range candidates {
			if candidateStr != userIDStr {
				// Found a candidate. Match them.
				// Use a simple Lua script to atomically remove both to prevent race conditions
				script := redis.NewScript(`
					local zrem1 = redis.call('ZREM', KEYS[1], ARGV[1])
					local zrem2 = redis.call('ZREM', KEYS[1], ARGV[2])
					if zrem1 == 1 and zrem2 == 1 then
						redis.call('DEL', KEYS[2], KEYS[3])
						return 1
					else
						-- Rollback if one of them was already removed
						if zrem1 == 1 then redis.call('ZADD', KEYS[1], ARGV[3], ARGV[1]) end
						if zrem2 == 1 then redis.call('ZADD', KEYS[1], ARGV[4], ARGV[2]) end
						return 0
					end
				`)

				// Fetch candidate's score for possible rollback
				candidateScore, _ := s.redisClient.ZScore(ctx, QueueSetKey, candidateStr).Result()

				result, err := script.Run(ctx, s.redisClient, 
					[]string{QueueSetKey, UserQueueKey + userIDStr, UserQueueKey + candidateStr}, 
					userIDStr, candidateStr, p.Score, candidateScore).Result()

				if err != nil {
					log.Printf("Matchmaking script error: %v", err)
					continue
				}

				if resInt, ok := result.(int64); ok && resInt == 1 {
					// Atomically matched
					p1UUID, _ := uuid.Parse(userIDStr)
					p2UUID, _ := uuid.Parse(candidateStr)
					
					// Asynchronously create the match to not block matchmaker
					go matchCreatedCallback(p1UUID, p2UUID)
					break // Break to outer loop (move to next unmatched player)
				}
			}
		}
	}
}
