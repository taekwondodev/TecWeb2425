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

func TestCheckUserExistsUsernameExists(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "existinguser"
	email := "newemail@example.com"
	rows := sqlmock.NewRows([]string{"username_exists", "email_exists"}).AddRow(true, false)
	mock.ExpectQuery(existQuery).WithArgs(username, email).WillReturnRows(rows)

	err := repo.CheckUserExists(username, email)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrUsernameAlreadyExists, err)
}

func TestCheckUserExistsEmailExists(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "newuser"
	email := "existingemail@example.com"
	rows := sqlmock.NewRows([]string{"username_exists", "email_exists"}).AddRow(false, true)
	mock.ExpectQuery(existQuery).WithArgs(username, email).WillReturnRows(rows)

	err := repo.CheckUserExists(username, email)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrEmailAlreadyExists, err)
}

func TestCheckUserExistsBothExist(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "existinguser"
	email := "existingemail@example.com"
	rows := sqlmock.NewRows([]string{"username_exists", "email_exists"}).AddRow(true, true)
	mock.ExpectQuery(existQuery).WithArgs(username, email).WillReturnRows(rows)

	err := repo.CheckUserExists(username, email)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrUsernameAlreadyExists, err) // Username error takes precedence
}

func TestCheckUserExistsNoneExist(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "newuser"
	email := "newemail@example.com"
	rows := sqlmock.NewRows([]string{"username_exists", "email_exists"}).AddRow(false, false)
	mock.ExpectQuery(existQuery).WithArgs(username, email).WillReturnRows(rows)

	err := repo.CheckUserExists(username, email)
	assert.NoError(t, err)
}

func TestCheckUserExistsDbError(t *testing.T) {
	db, mock, _ := sqlmock.New()
	defer db.Close()

	repo := repository.NewUserRepository(db)

	username := "testuser"
	email := "testemail@example.com"
	mock.ExpectQuery(existQuery).WithArgs(username, email).WillReturnError(sql.ErrConnDone)

	err := repo.CheckUserExists(username, email)
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
