package dto

import "github.com/go-playground/validator/v10"

type VoteRequest struct {
	MemeID int `json:"memeId" validate:"required,min=1"`
	Vote   int `json:"vote" validate:"required,oneof=-1 1"` // -1 per downvote, 1 per upvote
}

func (v *VoteRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(v)
}

type VoteResponse struct {
	Message string `json:"message"`
	Removed bool   `json:"removed,omitzero"`
}
