package dto

import (
	"github.com/go-playground/validator/v10"
)

type CreateCommentRequest struct {
	MemeID  int    `json:"memeId" validate:"required,min=1"`
	Content string `json:"content" validate:"required,min=1,max=500"`
}

func (c *CreateCommentRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(c)
}
