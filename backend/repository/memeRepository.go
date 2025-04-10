package repository

import (
	"backend/models"
	"context"
	"database/sql"
	"time"
)

type MemeRepository interface {
	SaveMeme(filePath string, tag string, username string) error
	CountsMeme(ctx context.Context) (int, error)
	GetMemes(ctx context.Context, page int, pageSize int, sortBy string) ([]models.Meme, error)
	GetRandomMeme() (*models.Meme, error)
}

type MemeRepositoryImpl struct {
	db *sql.DB
}

func NewMemeRepository(db *sql.DB) MemeRepository {
	return &MemeRepositoryImpl{db: db}
}

func (m *MemeRepositoryImpl) SaveMeme(filePath string, tag string, username string) error {
	query := "INSERT INTO memes (tag, image_path, created_by) VALUES ($1, $2, $3)"

	_, err := m.db.Exec(
		query,
		tag,
		filePath,
		username,
	)

	return err
}

func (m *MemeRepositoryImpl) CountsMeme(ctx context.Context) (int, error) {
	query := "SELECT COUNT(*) FROM memes"

	var count int
	err := m.db.QueryRowContext(ctx, query).Scan(&count)
	if err != nil {
		return 0, err
	}

	return count, nil
}

func (m *MemeRepositoryImpl) GetMemes(ctx context.Context, page int, pageSize int, sortBy string) ([]models.Meme, error) {
	offset := (page - 1) * pageSize

	query := `
        SELECT id, tag, image_path, upvotes, downvotes, created_by, created_at
        FROM memes
    `

	// ORDER BY in base al parametro
	switch sortBy {
	case "upvotes":
		query += " ORDER BY upvotes DESC"
	case "downvotes":
		query += " ORDER BY downvotes DESC"
	default:
		query += " ORDER BY created_at DESC"
	}

	// Aggiungi paginazione
	query += " LIMIT $1 OFFSET $2"

	rows, err := m.db.QueryContext(ctx, query, pageSize, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var memes []models.Meme
	for rows.Next() {
		var meme models.Meme
		if err := rows.Scan(
			&meme.ID, &meme.Tag, &meme.ImagePath,
			&meme.Upvotes, &meme.Downvotes,
			&meme.CreatedBy, &meme.CreatedAt,
		); err != nil {
			return nil, err
		}
		memes = append(memes, meme)
	}

	if err = rows.Err(); err != nil {
		return nil, err
	}

	return memes, nil
}

func (m *MemeRepositoryImpl) GetRandomMeme() (*models.Meme, error) {
	today := time.Now().UTC().Format("2006-01-02")

	var meme models.Meme
	// Use postgres function md5 for hashing
	err := m.db.QueryRow(`
		SELECT id, tag, image_path, upvotes, downvotes, created_by, created_at
		FROM memes
		ORDER BY md5(id::text || $1)
		LIMIT 1
	`, today).Scan(
		&meme.ID, &meme.Tag, &meme.ImagePath,
		&meme.Upvotes, &meme.Downvotes,
		&meme.CreatedBy, &meme.CreatedAt,
	)

	if err != nil {
		return nil, err
	}

	return &meme, nil
}
