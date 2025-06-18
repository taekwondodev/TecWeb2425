package service

import (
	"backend/dto"
	"backend/repository"
)

type CommentService interface {
	CreateComment(memeId int, content string, username string) (*dto.VoteResponse, error)
	GetComments(memeID int) (*dto.GetCommentResponse, error)
}

type CommentServiceImpl struct {
	repo repository.CommentRepository
}

func NewCommentService(repo repository.CommentRepository) CommentService {
	return &CommentServiceImpl{repo: repo}
}

func (s *CommentServiceImpl) CreateComment(memeId int, content string, username string) (*dto.VoteResponse, error) {
	if err := s.repo.SaveComment(memeId, content, username); err != nil {
		return nil, err
	}

	return &dto.VoteResponse{
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
