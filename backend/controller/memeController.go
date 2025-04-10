package controller

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/middleware"
	"backend/service"
	"encoding/json"
	"net/http"
	"path/filepath"
)

type MemeController struct {
	service service.MemeService
}

func NewMemeController(service service.MemeService) *MemeController {
	return &MemeController{service: service}
}

func (c *MemeController) GetImage(w http.ResponseWriter, r *http.Request) error {
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

func (c *MemeController) UploadMeme(w http.ResponseWriter, r *http.Request) error {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		return customerrors.ErrInvalidCredentials
	}

	if err := r.ParseMultipartForm(config.MaxFileSize); err != nil {
		return customerrors.ErrBadRequest
	}

	tag := r.FormValue("tag")

	file, header, err := r.FormFile("image")
	if err != nil {
		return customerrors.ErrBadRequest
	}
	defer file.Close()

	res, err := c.service.UploadMeme(file, header, tag, claims.Username)
	if err != nil {
		return err
	}

	return c.respond(w, http.StatusCreated, res)
}

func (c *MemeController) respond(w http.ResponseWriter, status int, data any) error {
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
