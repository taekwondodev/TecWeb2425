package middleware

import (
	"backend/config"
	"context"
	"net/http"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

type contextKey string

const (
	UserClaimsKey contextKey = "userClaims"
)

func AuthMiddleware(next HandlerFunc) HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		token := r.Header.Get("Authorization")
		if token == "" {
			return jwt.ErrSignatureInvalid
		}

		parts := strings.Split(token, " ")
		if len(parts) != 2 || parts[0] != "Bearer" {
			return jwt.ErrSignatureInvalid
		}

		tokenString := parts[1]

		claims, err := (&config.JWT{}).ValidateJWT(tokenString)
		if err != nil {
			return jwt.ErrTokenExpired
		}

		// Add the claims to the request context
		ctx := context.WithValue(r.Context(), UserClaimsKey, claims)
		*r = *r.WithContext(ctx)

		return next(w, r)
	}
}

func GetClaimsFromContext(ctx context.Context) (*config.Claims, error) {
	claims, ok := ctx.Value(UserClaimsKey).(*config.Claims)
	if !ok || claims == nil {
		return nil, jwt.ErrSignatureInvalid
	}
	return claims, nil
}
