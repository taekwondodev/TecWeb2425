package models

import "time"

type Comment struct {
	ID        int       `json:"id"`
	MemeID    int       `json:"memeId"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	CreatedBy string    `json:"createdBy"`
}
