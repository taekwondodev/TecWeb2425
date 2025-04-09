package test

import (
	customerrors "backend/customErrors"
	"backend/repository"
	"database/sql"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/stretchr/testify/assert"
	"golang.org/x/crypto/bcrypt"
)

const existQuery = "SELECT EXISTS"
const selectUserQuery = "SELECT id, username, email, password_hash, created_at, updated_at, is_active FROM users WHERE username = \\$1"
const emailString = "example@domain.com"
const date = "2023-01-01"

func TestCheckUsernameExistCorrect(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
	mock.ExpectQuery(existQuery).WithArgs(username).WillReturnRows(rows)

	err := repo.CheckUsernameExist(username)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrUserAlreadyExists, err)
}

func TestCheckUsernameExistNotFound(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	mock.ExpectQuery(existQuery).WithArgs(username).WillReturnError(sql.ErrNoRows)

	err := repo.CheckUsernameExist(username)
	assert.Error(t, err)
}

func TestCheckUsernameExistDbError(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	mock.ExpectQuery(existQuery).WithArgs(username).WillReturnError(sql.ErrConnDone)

	err := repo.CheckUsernameExist(username)
	assert.Error(t, err)
}

/****************************************************************/

func TestCheckEmailExistCorrect(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	rows := sqlmock.NewRows([]string{"exists"}).AddRow(true)
	mock.ExpectQuery(existQuery).WithArgs(emailString).WillReturnRows(rows)

	err := repo.CheckEmailExist(emailString)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrEmailAlreadyExists, err)
}

func TestCheckEmailExistNotFound(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	mock.ExpectQuery(existQuery).WithArgs(emailString).WillReturnError(sql.ErrNoRows)

	err := repo.CheckEmailExist(emailString)
	assert.Error(t, err)
}

func TestCheckEmailExistDbError(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	mock.ExpectQuery(existQuery).WithArgs(emailString).WillReturnError(sql.ErrConnDone)

	err := repo.CheckEmailExist(emailString)
	assert.Error(t, err)
}

/****************************************************************/

func TestSaveUserCorrect(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	password := "password123"
	mock.ExpectExec("INSERT INTO users \\(username, email, password_hash\\) VALUES \\(\\$1, \\$2, \\$3\\)").
		WithArgs(username, emailString, sqlmock.AnyArg()).
		WillReturnResult(sqlmock.NewResult(1, 1))

	err := repo.SaveUser(username, password, emailString)
	assert.NoError(t, err)
}

func TestSaveUserDbError(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	password := "password123"
	mock.ExpectExec("INSERT INTO users").WithArgs(username, password, emailString).WillReturnError(sql.ErrConnDone)

	err := repo.SaveUser(username, password, emailString)
	assert.Error(t, err)
}

/****************************************************************/

func TestGetUserByCredentialsCorrect(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	password := "password123"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	columns := []string{"id", "username", "email", "password_hash", "created_at", "updated_at", "is_active"}

	mock.ExpectQuery(selectUserQuery).
		WithArgs(username).
		WillReturnRows(
			sqlmock.NewRows(columns).
				AddRow(1, username, emailString, string(hashedPassword), date, date, true),
		)

	user, err := repo.GetUserByCredentials(username, password)
	assert.NoError(t, err)
	assert.NotNil(t, user)
	assert.Equal(t, username, user.Username)
}

func TestGetUserByCredentialsIncorrectPassword(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	password := "password123"
	wrongPassword := "wrongpassword"
	hashedPassword, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	columns := []string{"id", "username", "email", "password_hash", "created_at", "updated_at", "is_active"}

	mock.ExpectQuery(selectUserQuery).
		WithArgs(username).
		WillReturnRows(
			sqlmock.NewRows(columns).
				AddRow(1, username, emailString, string(hashedPassword), date, date, true),
		)

	user, err := repo.GetUserByCredentials(username, wrongPassword)
	assert.Error(t, err)
	assert.Nil(t, user)
}

func TestGetUserByCredentialsUserNotFound(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "nonexistentuser"
	password := "password123"

	mock.ExpectQuery(selectUserQuery).
		WithArgs(username).
		WillReturnError(sql.ErrNoRows)

	user, err := repo.GetUserByCredentials(username, password)
	assert.Error(t, err)
	assert.Nil(t, user)
}

func TestGetUserByCredentialsExistDbError(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	password := "password123"

	mock.ExpectQuery(selectUserQuery).
		WithArgs(username).
		WillReturnError(sql.ErrConnDone)

	user, err := repo.GetUserByCredentials(username, password)
	assert.Error(t, err)
	assert.Nil(t, user)
}
