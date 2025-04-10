package repository

import "database/sql"

type MemeRepository interface {
	SaveMeme(filePath string, tag string, username string) error
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
