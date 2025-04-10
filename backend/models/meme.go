package models

import "time"

type Meme struct {
	ID        int       `json:"id"`
	Tag       string    `json:"tag"`
	ImagePath string    `json:"imagePath"`
	Upvotes   int       `json:"upvotes"`
	Downvotes int       `json:"downvotes"`
	Comments  []Comment `json:"comments"`
	CreatedAt time.Time `json:"createdAt"`
	CreatedBy string    `json:"createdBy"`
}

type Comment struct {
	ID        int       `json:"id"`
	MemeID    int       `json:"memeId"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"createdAt"`
	CreatedBy string    `json:"createdBy"`
}
