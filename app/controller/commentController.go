package controller

import (
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/middleware"
	"backend/service"
	"encoding/json"
	"net/http"
	"strconv"
)

type CommentController struct {
	service service.CommentService
}

func NewCommentController(service service.CommentService) *CommentController {
	return &CommentController{service: service}
}

func (c *CommentController) CreateComment(w http.ResponseWriter, r *http.Request) error {
	claims, err := middleware.GetClaimsFromContext(r.Context())
	if err != nil {
		return customerrors.ErrInvalidCredentials
	}

	memeId, err := strconv.Atoi(r.PathValue("memeId"))
	if err != nil || memeId < 1 {
		return customerrors.ErrBadRequest
	}

	var req dto.CreateCommentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return customerrors.ErrBadRequest
	}

	res, err := c.service.CreateComment(memeId, req.Content, claims.Username)
	if err != nil {
		return err
	}

	return c.respond(w, http.StatusCreated, res)
}

func (c *CommentController) GetComments(w http.ResponseWriter, r *http.Request) error {
	memeId, err := strconv.Atoi(r.PathValue("id"))
	if err != nil || memeId < 1 {
		return customerrors.ErrBadRequest
	}

	res, err := c.service.GetComments(memeId)
	if err != nil {
		return err
	}

	return c.respond(w, http.StatusOK, res)
}

func (c *CommentController) respond(w http.ResponseWriter, status int, data any) error {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	return json.NewEncoder(w).Encode(data)
}
