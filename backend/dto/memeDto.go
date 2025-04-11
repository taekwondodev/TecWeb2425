package dto

import (
	"backend/models"

	"github.com/go-playground/validator/v10"
)

type MemeUploadResponse struct {
	Message string `json:"message"`
}

type GetMemeResponse struct {
	Memes       []models.Meme `json:"memes"`
	CurrentPage int           `json:"currentPage"`
	TotalPages  int           `json:"totalPages"`
	TotalMemes  int           `json:"totalMemes"`
}

type VoteRequest struct {
	MemeID int `json:"memeId" validate:"required,min=1"`
	Vote   int `json:"vote" validate:"required,oneof=-1 1"` // -1 per downvote, 1 per upvote
}

func (v *VoteRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(v)
}
