package models

import "time"

type Meme struct {
	ID        int       `json:"id"`
	Tag       string    `json:"tag"`
	ImagePath string    `json:"imagePath"`
	Upvotes   int       `json:"upvotes"`
	Downvotes int       `json:"downvotes"`
	Comments  []Comment `json:"comments,omitzero"`
	CreatedAt time.Time `json:"createdAt"`
	CreatedBy int       `json:"createdBy"`
}
