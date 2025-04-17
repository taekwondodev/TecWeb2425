package repository

import (
	"backend/models"
	"database/sql"
)

type CommentRepository interface {
	SaveComment(memeID int, content string, username string) error
	GetComments(memeID int) ([]models.Comment, error)
}

type CommentRepositoryImpl struct {
	db *sql.DB
}

func NewCommentRepository(db *sql.DB) CommentRepository {
	return &CommentRepositoryImpl{db: db}
}

func (m *CommentRepositoryImpl) SaveComment(memeID int, content string, username string) error {
	query := "INSERT INTO comments (meme_id, content, created_by) VALUES ($1, $2, $3)"
	_, err := m.db.Exec(query, memeID, content, username)

	return err
}

func (m *CommentRepositoryImpl) GetComments(memeID int) ([]models.Comment, error) {
	query := "SELECT id, meme_id, content, created_at, created_by FROM comments WHERE meme_id = $1"
	rows, err := m.db.Query(query, memeID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []models.Comment
	for rows.Next() {
		var comment models.Comment
		if err := rows.Scan(
			&comment.ID, &comment.MemeID,
			&comment.Content, &comment.CreatedAt,
			&comment.CreatedBy); err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}

	return comments, nil
}
