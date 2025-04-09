package repository

import (
	customerrors "backend/customErrors"
	"backend/models"
	"database/sql"

	"golang.org/x/crypto/bcrypt"
)

type UserRepository interface {
	CheckUsernameExist(username string) error
	SaveUser(username string, password string, email string) error
	GetUserByCredentials(username string, password string) (*models.User, error)
	CheckEmailExist(email string) error
}

type UserRepositoryImpl struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &UserRepositoryImpl{db: db}
}

func (r *UserRepositoryImpl) CheckUsernameExist(username string) error {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE username=$1)"
	err := r.db.QueryRow(query, username).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return customerrors.ErrUserAlreadyExists
	}
	return nil
}

func (r *UserRepositoryImpl) CheckEmailExist(email string) error {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM users WHERE email=$1)"
	err := r.db.QueryRow(query, email).Scan(&exists)
	if err != nil {
		return err
	}
	if exists {
		return customerrors.ErrEmailAlreadyExists
	}
	return nil
}

func (r *UserRepositoryImpl) SaveUser(username string, password string, email string) error {
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return err
	}

	query := "INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3)"

	_, err = r.db.Exec(
		query,
		username,
		email,
		string(hashedPassword),
	)
	return err
}

func (r *UserRepositoryImpl) GetUserByCredentials(username string, password string) (*models.User, error) {
	var user models.User
	query := `
        SELECT id, username, email, password_hash, created_at, updated_at, is_active
        FROM users
        WHERE username = $1
    `

	err := r.db.QueryRow(query, username).Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.PasswordHash,
		&user.CreatedAt,
		&user.UpdatedAt,
		&user.IsActive,
	)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, customerrors.ErrUserNotFound
		}
		return nil, err
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		if err == bcrypt.ErrMismatchedHashAndPassword {
			return nil, customerrors.ErrInvalidCredentials
		}
		return nil, err
	}

	return &user, nil
}
