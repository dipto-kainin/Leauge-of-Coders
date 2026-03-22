package config

import (
	"context"
	"fmt"
	"os"

	"github.com/redis/go-redis/v9"
)

var RedisClient *redis.Client

func ConnectRedis() error {
	addr := os.Getenv("REDIS_ADDR")
	if addr == "" {
		addr = "localhost:6379"
	}

	client := redis.NewClient(&redis.Options{
		Addr: addr,
	})

	_, err := client.Ping(context.Background()).Result()
	if err != nil {
		return fmt.Errorf("failed to connect to Redis: %w", err)
	}

	RedisClient = client
	return nil
}
