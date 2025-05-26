package dto

import (
	"html"
	"strings"
	"unicode/utf8"

	"github.com/go-playground/validator/v10"
)

type AuthRequest struct {
	Username string `json:"username" validate:"required,max=50"`
	Password string `json:"password" validate:"required,min=8"`
	Email    string `json:"email" validate:"omitzero,email,max=100"`
}

func (a *AuthRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(a)
}

func (a *AuthRequest) Sanitize() {
	a.Username = sanitize(a.Username, 50)
	a.Email = sanitize(a.Email, 100)
}

func sanitize(input string, maxLen int) string {
	input = strings.TrimSpace(input)
	input = html.EscapeString(input)

	if utf8.RuneCountInString(input) > maxLen {
		runes := []rune(input)
		input = string(runes[:maxLen])
	}

	return input
}

type AuthResponse struct {
	Message      string `json:"message"`
	AccessToken  string `json:"accessToken,omitzero"`
	RefreshToken string `json:"refreshToken,omitzero"`
}
