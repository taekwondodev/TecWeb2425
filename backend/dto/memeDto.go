package dto

import (
	"backend/models"
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
