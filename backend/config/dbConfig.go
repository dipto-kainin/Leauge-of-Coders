package config

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func ConnectDB() (*gorm.DB, error) {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s sslmode=%s prefer_simple_protocol=true",
		os.Getenv("PGHOST"),
		os.Getenv("PGUSER"),
		os.Getenv("PGPASSWORD"),
		os.Getenv("PGDATABASE"),
		os.Getenv("PGSSLMODE"),
	)

	// channel_binding is optional – only add it when explicitly set.
	if cb := os.Getenv("PGCHANNELBINDING"); cb != "" {
		dsn += fmt.Sprintf(" channel_binding=%s", cb)
	}

	cfg := &gorm.Config{
		Logger:                   logger.Default.LogMode(logger.Warn),
		NamingStrategy:           nil,
		DisableNestedTransaction: false,
	}
	db, err := gorm.Open(postgres.Open(dsn), cfg)
	if err != nil {
		return nil, fmt.Errorf("failed to open database connection: %w", err)
	}
	if err := db.Exec(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`).Error; err != nil {
		return nil, fmt.Errorf("failed to enable uuid-ossp extension: %w", err)
	}

	return db, nil
}
