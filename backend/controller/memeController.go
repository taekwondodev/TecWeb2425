package controller

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/middleware"
	"backend/service"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
)

type MemeController struct {
	service service.MemeService
}

func NewMemeController(service service.MemeService) *MemeController {
	return &MemeController{service: service}
}

func (c *MemeController) GetMemes(w http.ResponseWriter, r *http.Request) error {
	page, err := strconv.Atoi(r.URL.Query().Get("page"))
	if err != nil || page < 1 {
		page = 1
	}

	pageSize, err := strconv.Atoi(r.URL.Query().Get("pageSize"))
	if err != nil || pageSize < 1 || pageSize > 50 {
		pageSize = 10
	}

	sortBy := r.URL.Query().Get("sortBy")
	if sortBy == "" {
		sortBy = "newest" // Default
	}

	dateFrom := r.URL.Query().Get("dateFrom")
	dateTo := r.URL.Query().Get("dateTo")
	tagFilter := r.URL.Query().Get("filterBy")

	filterOptions := dto.MemeFilterOptions{
		DateFrom: dateFrom,
		DateTo:   dateTo,
		Tags:     []string{},
	}

	// Process tags if any
	if tagFilter != "" {
		filterOptions.Tags = strings.Split(tagFilter, ",")
	}

	res, err := c.service.GetMemes(r.Context(), page, pageSize, sortBy, filterOptions)
	if err != nil {
		return err
	}

	for i := range res.Memes {
		res.Memes[i].ImagePath = c.buildImageUrl(r, res.Memes[i].ImagePath)
	}

	return c.respond(w, http.StatusOK, res)
}

func (c *MemeController) GetDailyMeme(w http.ResponseWriter, r *http.Request) error {
	res, err := c.service.GetDailyMeme()
	if err != nil {
		return err
	}

	res.ImagePath = c.buildImageUrl(r, res.ImagePath)

	return c.respond(w, http.StatusOK, res)
}

func (c *MemeController) GetMemeById(w http.ResponseWriter, r *http.Request) error {
	memeId, err := strconv.Atoi(r.URL.Query().Get("memeId"))
	if err != nil || memeId < 1 {
		return customerrors.ErrBadRequest
	}

	res, err := c.service.GetMemeById(memeId)
	if err != nil {
		return err
	}

	res.ImagePath = c.buildImageUrl(r, res.ImagePath)

	return c.respond(w, http.StatusOK, res)
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

func (c *MemeController) VoteMeme(w http.ResponseWriter, r *http.Request) error {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		return customerrors.ErrInvalidCredentials
	}

	var req dto.VoteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return customerrors.ErrBadRequest
	}

	res, err := c.service.VoteMeme(r.Context(), claims.Id, req)
	if err != nil {
		return err
	}

	return c.respond(w, http.StatusOK, res)
}

func (c *MemeController) respond(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}

func (c *MemeController) buildImageUrl(r *http.Request, imagePath string) string {
	return fmt.Sprintf("%s://%s/%s", "http", r.Host, imagePath)
}
