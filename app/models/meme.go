package models

import "time"

type Meme struct {
	ID        int       `json:"id"`
	Tag       string    `json:"tag"`
	ImagePath string    `json:"imagePath"`
	Upvotes   int       `json:"upvotes"`
	Downvotes int       `json:"downvotes"`
	CreatedAt time.Time `json:"createdAt"`
	CreatedBy string    `json:"createdBy"`
}
