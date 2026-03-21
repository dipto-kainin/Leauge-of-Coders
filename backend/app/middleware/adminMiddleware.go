package middleware

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

// AdminMiddleware checks that the authenticated user has the "admin" role.
// Must be used AFTER AuthMiddleware (which sets "user_id" in context).
func AdminMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		rawToken, err := c.Cookie("token")
		if err != nil || rawToken == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
			return
		}

		claims := jwt.MapClaims{}
		token, err := jwt.ParseWithClaims(rawToken, claims, func(token *jwt.Token) (interface{}, error) {
			return []byte(os.Getenv("JWT_SECRET")), nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		role, ok := claims["role"].(string)
		if !ok || role != "admin" {
			c.AbortWithStatusJSON(http.StatusForbidden, gin.H{"error": "admin access required"})
			return
		}

		c.Next()
	}
}
