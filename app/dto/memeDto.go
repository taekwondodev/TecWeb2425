package dto

import (
	"backend/models"
)

type MemeFilterOptions struct {
	DateFrom string   `json:"dateFrom,omitzero"`
	DateTo   string   `json:"dateTo,omitzero"`
	Tags     []string `json:"tags,omitzero"`
}

type MemeUploadResponse struct {
	Message string `json:"message"`
	MemeID  int    `json:"memeId"`
}

type GetMemeResponse struct {
	Memes       []models.Meme `json:"memes"`
	CurrentPage int           `json:"currentPage"`
	TotalPages  int           `json:"totalPages"`
	TotalMemes  int           `json:"totalMemes"`
}
