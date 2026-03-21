package middleware

import (
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

func CORSMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rawOrigins := os.Getenv("ALLOWED_ORIGINS")
		if rawOrigins == "" {
			rawOrigins = "http://localhost:3000"
		}

		allowedOrigins := strings.Split(rawOrigins, ",")
		for i, o := range allowedOrigins {
			allowedOrigins[i] = strings.TrimSpace(o)
		}

		requestOrigin := c.Request.Header.Get("Origin")

		// Check whether the request origin is in the allowed list.
		originAllowed := false
		for _, allowed := range allowedOrigins {
			if allowed == requestOrigin {
				originAllowed = true
				break
			}
		}

		if originAllowed {
			c.Header("Access-Control-Allow-Origin", requestOrigin)
			c.Header("Access-Control-Allow-Credentials", "true")
			c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
			c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, Authorization")
			c.Header("Access-Control-Max-Age", "86400") // cache preflight for 24h
		}

		// Handle pre-flight requests immediately.
		// Must be AFTER setting headers — otherwise browser gets 204 with no ACAO header.
		if c.Request.Method == "OPTIONS" {
			if originAllowed {
				c.AbortWithStatus(204)
			} else {
				c.AbortWithStatus(403)
			}
			return
		}

		c.Next()
	}
}
