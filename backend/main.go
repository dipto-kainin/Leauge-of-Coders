package main

import (
	"bufio"
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/auth"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/middleware"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/models"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/problems"
	"github.com/dipto-kainin/Leauge-of-Coders/backend/app/matchmaking"
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

	// Connect Redis
	if err := config.ConnectRedis(); err != nil {
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

		if err := db.AutoMigrate(
            &models.User{}, 
            &models.Problem{}, 
            &models.TestCase{},
            &models.Match{},
            &models.Submission{},
        ); err != nil {
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

	// Build problem dependencies
	problemRepo := problems.NewProblemRepository(db)
	problemService := problems.NewProblemService(problemRepo, authRepo)
	problemHandler := problems.NewProblemHandler(problemService)

	// Build matchmaking dependencies
	wsHub := matchmaking.NewHub()
	matchService := matchmaking.NewMatchService(db, wsHub)
	submissionService := matchmaking.NewSubmissionService(db, matchService)
	queueService := matchmaking.NewQueueService()

	// We pass background context. It runs forever.
	queueService.StartMatchmaker(context.Background(), func(p1, p2 uuid.UUID) {
		matchService.CreateMatch(context.Background(), p1, p2)
	})

	wsHandler := matchmaking.NewWSHandler(db, wsHub)
	queueHandler := matchmaking.NewQueueHandler(queueService, db)
	matchHandler := matchmaking.NewMatchHandler(db, matchService, submissionService)

	// Create Gin app
	app := gin.Default()

	app.Use(middleware.CORSMiddleware())

	// Middleware
	authMiddleware := middleware.AuthMiddleware()
	adminMw := middleware.AdminMiddleware()

	// Optional health check
	app.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	// Register routes
	routes.RegisterAuthRoutes(app, authMiddleware, authHandler)
	routes.RegisterProblemRoutes(app, authMiddleware, adminMw, problemHandler)
	routes.RegisterMatchmakingRoutes(app, authMiddleware, queueHandler, matchHandler, wsHandler)

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
