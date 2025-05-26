package repository

import (
	customerrors "backend/customErrors"
	"backend/models"
	"context"
	"database/sql"
	"fmt"
	"html"
	"strings"
	"time"
	"unicode/utf8"
)

type MemeRepository interface {
	SaveMeme(filePath string, tag string, username string) (int, error)
	CountsMeme(ctx context.Context, filterDateFrom, filterDateTo string, filterTags []string) (int, error)
	GetMemes(ctx context.Context, page int, pageSize int, sortBy string, filterDateFrom, filterDateTo string, filterTags []string) ([]models.Meme, error)
	GetRandomMeme() (*models.Meme, error)
	GetMemeById(id int) (*models.Meme, error)
	BeginTransaction(ctx context.Context) (VoteRepository, error)
}

type MemeRepositoryImpl struct {
	db *sql.DB
}

func NewMemeRepository(db *sql.DB) MemeRepository {
	return &MemeRepositoryImpl{db: db}
}

func (m *MemeRepositoryImpl) SaveMeme(fileName string, tag string, username string) (int, error) {
	tag = sanitize(tag)

	if tag == "" || username == "" {
		return -1, customerrors.ErrBadRequest
	}

	query := "INSERT INTO memes (tag, image_path, created_by) VALUES ($1, $2, $3) RETURNING id"

	var id int
	err := m.db.QueryRow(
		query,
		tag,
		fileName,
		username,
	).Scan(&id)

	if err != nil {
		return -1, err
	}

	return id, nil
}

func (m *MemeRepositoryImpl) CountsMeme(ctx context.Context, filterDateFrom, filterDateTo string, filterTags []string) (int, error) {
	baseQuery := "SELECT COUNT(*) FROM memes WHERE 1=1"
	query, args, _ := m.buildFilterQuery(baseQuery, filterDateFrom, filterDateTo, filterTags)

	var count int
	err := m.db.QueryRowContext(ctx, query, args...).Scan(&count)
	if err != nil {
		return -1, err
	}

	return count, nil
}

func (m *MemeRepositoryImpl) GetMemes(ctx context.Context, page int, pageSize int, sortBy string, filterDateFrom, filterDateTo string, filterTags []string) ([]models.Meme, error) {
	offset := (page - 1) * pageSize

	baseQuery := `
        SELECT id, tag, image_path, upvotes, downvotes, created_by, created_at
        FROM memes
		WHERE 1=1
    `

	query, args, argPosition := m.buildFilterQuery(baseQuery, filterDateFrom, filterDateTo, filterTags)

	// ORDER BY in base al parametro
	switch sortBy {
	case "upvotes":
		query += " ORDER BY upvotes DESC"
	case "downvotes":
		query += " ORDER BY downvotes DESC"
	case "oldest":
		query += " ORDER BY created_at ASC"
	default:
		query += " ORDER BY created_at DESC"
	}

	// Add pagination
	query += fmt.Sprintf(" LIMIT $%d OFFSET $%d", argPosition, argPosition+1)
	args = append(args, pageSize, offset)

	rows, err := m.db.QueryContext(ctx, query, args...)
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

func (m *MemeRepositoryImpl) GetMemeById(id int) (*models.Meme, error) {
	var meme models.Meme
	query := `
		SELECT id, tag, image_path, upvotes, downvotes, created_by, created_at
		FROM memes
		WHERE id = $1
	`
	err := m.db.QueryRow(query, id).Scan(
		&meme.ID, &meme.Tag, &meme.ImagePath,
		&meme.Upvotes, &meme.Downvotes,
		&meme.CreatedBy, &meme.CreatedAt,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}

	return &meme, nil
}

func (m *MemeRepositoryImpl) BeginTransaction(ctx context.Context) (VoteRepository, error) {
	tx, err := m.db.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	return &voteRepository{tx: tx}, nil
}

func (m *MemeRepositoryImpl) buildFilterQuery(baseQuery string, filterDateFrom, filterDateTo string, filterTags []string) (string, []any, int) {
	query := baseQuery
	args := []any{}
	argPosition := 1

	// Add date filters if provided
	if filterDateFrom != "" {
		if isValidDate(filterDateFrom) {
			query += fmt.Sprintf(" AND created_at >= $%d", argPosition)
			args = append(args, filterDateFrom)
			argPosition++
		}
	}

	if filterDateTo != "" {
		if isValidDate(filterDateTo) {
			query += fmt.Sprintf(" AND created_at <= $%d", argPosition)
			args = append(args, filterDateTo)
			argPosition++
		}
	}

	// Add tag filter if provided
	if len(filterTags) > 0 {
		placeholders := make([]string, len(filterTags))
		for i, tag := range filterTags {
			sanitezedTag := sanitize(tag)
			if sanitezedTag != "" {
				placeholders[i] = fmt.Sprintf("tag LIKE $%d", argPosition)
				args = append(args, "%"+sanitezedTag+"%") // Using LIKE with wildcard for tag matching
				argPosition++
			}
		}
		query += " AND (" + strings.Join(placeholders, " OR ") + ")"
	}

	return query, args, argPosition
}

func sanitize(input string) string {
	input = strings.TrimSpace(input)

	input = html.EscapeString(input)

	if utf8.RuneCountInString(input) > 100 {
		runes := []rune(input)
		input = string(runes[:100])
	}

	return input
}

func isValidDate(dateStr string) bool {
	_, err := time.Parse("2006-01-02", dateStr)
	return err == nil
}
