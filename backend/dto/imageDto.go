package dto

import "github.com/go-playground/validator/v10"

type ImageUploadRequest struct {
	Image []byte `form:"image" validate:"required"`
}

func (i *ImageUploadRequest) Validate() error {
	validate := validator.New()
	return validate.Struct(i)
}

type ImageUploadResponse struct {
	Message string `json:"message"`
}
