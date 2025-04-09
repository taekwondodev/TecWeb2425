package controller

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/service"
	"encoding/json"
	"net/http"
	"path/filepath"
)

type ImageController struct {
	service service.ImageService
}

func NewImageController(service service.ImageService) *ImageController {
	return &ImageController{service: service}
}

func (c *ImageController) GetImage(w http.ResponseWriter, r *http.Request) error {
	filename := r.URL.Path[len("/images/"):]
	if filename == "" {
		return customerrors.ErrBadRequest
	}

	filePath, err := c.service.GetImage(filename)
	if err != nil {
		return err
	}

	w.Header().Set("Content-Type", getContentType(filename))
	http.ServeFile(w, r, filePath)
	return nil
}

func (c *ImageController) UploadImage(w http.ResponseWriter, r *http.Request) error {
	if err := r.ParseMultipartForm(config.MaxFileSize); err != nil {
		return customerrors.ErrBadRequest
	}

	file, header, err := r.FormFile("image")
	if err != nil {
		return customerrors.ErrBadRequest
	}
	defer file.Close()

	res, err := c.service.UploadImage(file, header)
	if err != nil {
		return err
	}

	return c.respond(w, http.StatusOK, res)
}

func (c *ImageController) respond(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

func getContentType(filename string) string {
	ext := filepath.Ext(filename)
	switch ext {
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".gif":
		return "image/gif"
	default:
		return "application/octet-stream"
	}
}
