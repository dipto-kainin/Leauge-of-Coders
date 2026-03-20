package config

import (
	"errors"
	"log"
	"os"

	"github.com/joho/godotenv"
)

func LoadEnv() error {
	candidates := []string{
		".env",
	}

	for _, path := range candidates {
		err := godotenv.Load(path)
		if err == nil {
			log.Printf("loaded environment from %s", path)
			return nil
		}
		if errors.Is(err, os.ErrNotExist) {
			continue
		}
		return err
	}
	log.Println("warning: no .env or config/dev.env file found; " +
		"using environment variables already set in the process")
	return nil
}
