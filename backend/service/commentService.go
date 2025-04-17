package service

import (
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/repository"
)

type CommentService interface {
	CreateComment(req dto.CreateCommentRequest, username string) (*dto.MemeUploadResponse, error)
	GetComments(memeID int) (*dto.GetCommentResponse, error)
}

type CommentServiceImpl struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &CommentServiceImpl{repo: repo}
}

func (s *CommentServiceImpl) CreateComment(req dto.CreateCommentRequest, username string) (*dto.MemeUploadResponse, error) {
	if err := req.Validate(); err != nil {
		return nil, customerrors.ErrBadRequest
	}

	if err := s.repo.SaveComment(req.MemeID, req.Content, username); err != nil {
		return nil, err
	}

	return &dto.MemeUploadResponse{
		Message: "Comment created successfully!",
	}, nil
}

func (s *CommentServiceImpl) GetComments(memeID int) (*dto.GetCommentResponse, error) {
	comments, err := s.repo.GetComments(memeID)
	if err != nil {
		return nil, err
	}

	message := "Comments found"
	if len(comments) == 0 {
		message = "No comments found"
	}

	return &dto.GetCommentResponse{
		Message:  message,
		Comments: comments,
	}, nil
}
