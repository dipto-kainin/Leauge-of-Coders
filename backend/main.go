package main

import (
	"bufio"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/auth"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/middleware"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/routes"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/config"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

func main() {
	// Load environment variables
	if err := config.LoadEnv(); err != nil {
		fmt.Println("error loading env:", err)
		log.Fatal(err)
	}

	// Validate required auth config
	if os.Getenv("JWT_SECRET") == "" {
		log.Fatal("JWT_SECRET is required")
	}

	// Connect database
	db, err := config.ConnectDB()
	if err != nil {
		log.Fatal(err)
	}

	scanner := bufio.NewScanner(os.Stdin)

	fmt.Print("Do you want to auto-migrate models? (y/n): ")
	if !scanner.Scan() {
		log.Fatal("failed to read input")
	}

	choice := strings.TrimSpace(strings.ToLower(scanner.Text()))

	if choice == "y" || choice == "yes" {
		fmt.Println("Auto-migrating models...")

		if err := db.AutoMigrate(&models.User{}); err != nil {
			log.Fatal(err)
		}
	}

	if err := scanner.Err(); err != nil {
		log.Fatal(err)
	}

	// Build auth dependencies
	authRepo := auth.NewAuthRepository(db)
	authService := auth.NewService(authRepo)
	authHandler := auth.NewAuthHandler(authService)

	// Create Gin app
	app := gin.Default()

	app.Use(middleware.CORSMiddleware())

	// JWT bearer middleware for protected endpoints
	authMiddleware := middleware.AuthMiddleware()

	// Optional health check
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Register auth routes
	routes.RegisterAuthRoutes(app, authMiddleware, authHandler)

	// Get port from environment variable, default to 8080 if not set
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	// Run the app on the specified port
	if err := app.Run(":" + port); err != nil {
		log.Fatal(err)
	}
}

// compile-time check to ensure UUID type is linked where expected
var _ = uuid.Nil
