package test

import (
	"backend/config"
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/models"
	"backend/service"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockUserRepository struct {
	mock.Mock
}

type MockToken struct {
	mock.Mock
}

func (m *MockUserRepository) CheckUsernameExist(username string) error {
	args := m.Called(username)
	return args.Error(0)
}

func (m *MockUserRepository) CheckEmailExist(email string) error {
	args := m.Called(email)
	return args.Error(0)
}

func (m *MockUserRepository) SaveUser(username string, password string, email string) error {
	args := m.Called(username, password, email)
	return args.Error(0)
}

func (m *MockUserRepository) GetUserByCredentials(username string, password string) (*models.User, error) {
	args := m.Called(username, password)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.User), args.Error(1)
}

func (m *MockToken) GenerateJWT(username string, email string) (string, string, error) {
	args := m.Called(username, email)
	return args.String(0), args.String(1), args.Error(2)
}

func (m *MockToken) ValidateJWT(tokenString string) (*config.Claims, error) {
	args := m.Called(tokenString)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*config.Claims), args.Error(1)
}

/*******************************************************************************/

func TestAuthServiceRegisterCorrect(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "password123",
		Email:    emailString,
	}

	mockRepo.On("CheckEmailExist", req.Email).Return(nil)
	mockRepo.On("CheckUsernameExist", req.Username).Return(nil)
	mockRepo.On("SaveUser", req.Username, req.Password, req.Email).Return(nil)

	res, err := authService.Register(req)

	assert.NoError(t, err)
	assert.Equal(t, "Sign-Up successfully!", res.Message)
	mockRepo.AssertExpectations(t)
}

func TestAuthServiceRegisterInvalidRequest(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "",
		Password: "",
		Email:    "",
	}

	res, err := authService.Register(req)

	assert.Nil(t, res)
	assert.Error(t, err)
}

func TestAuthServiceRegisterUserAlreadyExists(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "existinguser",
		Password: "password123",
		Email:    emailString,
	}

	mockRepo.On("CheckEmailExist", req.Email).Return(nil)
	mockRepo.On("CheckUsernameExist", req.Username).Return(customerrors.ErrUserAlreadyExists)

	res, err := authService.Register(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrUserAlreadyExists.Error(), err.Error())
	mockRepo.AssertExpectations(t)
}

func TestAuthServiceRegisterEmailAlreadyExists(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "existinguser",
		Password: "password123",
		Email:    emailString,
	}

	mockRepo.On("CheckEmailExist", req.Email).Return(customerrors.ErrEmailAlreadyExists)

	res, err := authService.Register(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, customerrors.ErrEmailAlreadyExists.Error(), err.Error())
	mockRepo.AssertExpectations(t)
}

func TestAuthServiceRegisterSaveUserError(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "newuser",
		Password: "password123",
		Email:    emailString,
	}

	mockRepo.On("CheckEmailExist", req.Email).Return(nil)
	mockRepo.On("CheckUsernameExist", req.Username).Return(nil)
	mockRepo.On("SaveUser", req.Username, req.Password, req.Email).Return(assert.AnError)

	res, err := authService.Register(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockRepo.AssertExpectations(t)
}

/*******************************************************************************/

func TestAuthServiceLoginCorrect(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "password123",
	}

	mockUser := &models.User{
		Username: "testuser",
		Email:    emailString,
	}

	mockRepo.On("GetUserByCredentials", req.Username, req.Password).Return(mockUser, nil)
	mockToken.On("GenerateJWT", mockUser.Username, mockUser.Email).Return("mockAccessToken", "mockRefreshToken", nil)

	res, err := authService.Login(req)

	assert.NoError(t, err)
	assert.Equal(t, "Sign-In successfully!", res.Message)
	assert.Equal(t, "mockAccessToken", res.AccessToken)
	assert.Equal(t, "mockRefreshToken", res.RefreshToken)
	mockRepo.AssertExpectations(t)
	mockToken.AssertExpectations(t)
}

func TestAuthServiceLoginInvalidRequest(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "",
		Password: "",
	}

	res, err := authService.Login(req)

	assert.Nil(t, res)
	assert.Error(t, err)
}

func TestAuthServiceLoginUserNotExists(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "existinguser",
		Password: "password123",
	}

	mockRepo.On("GetUserByCredentials", req.Username, req.Password).Return(nil, assert.AnError)

	res, err := authService.Login(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockRepo.AssertExpectations(t)
}

func TestAuthServiceLoginJWTError(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.AuthRequest{
		Username: "fail",
		Password: "password123",
	}

	mockUser := &models.User{
		Username: "fail",
		Email:    emailString,
	}

	mockRepo.On("GetUserByCredentials", req.Username, req.Password).Return(mockUser, nil)
	mockToken.On("GenerateJWT", mockUser.Username, mockUser.Email).Return("", "", assert.AnError)

	res, err := authService.Login(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockRepo.AssertExpectations(t)
	mockToken.AssertExpectations(t)
}

/*******************************************************************************/

func TestAuthServiceRefreshCorrect(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.RefreshTokenRequest{
		RefreshToken: "valid-refresh-token",
	}

	mockToken.On("ValidateJWT", req.RefreshToken).Return(&config.Claims{Username: "testuser", Email: emailString}, nil)
	mockToken.On("GenerateJWT", "testuser", emailString).Return("mockAccessToken", "", nil)

	res, err := authService.Refresh(req)

	assert.NoError(t, err)
	assert.Equal(t, "Update token successfully!", res.Message)
	assert.Equal(t, "mockAccessToken", res.AccessToken)
	mockToken.AssertExpectations(t)
}

func TestAuthServiceRefreshInvalidRequest(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.RefreshTokenRequest{
		RefreshToken: "",
	}

	res, err := authService.Refresh(req)

	assert.Nil(t, res)
	assert.Error(t, err)
}

func TestAuthServiceRefreshInvalidToken(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.RefreshTokenRequest{
		RefreshToken: "invalid",
	}

	mockToken.On("ValidateJWT", req.RefreshToken).Return(nil, assert.AnError)

	res, err := authService.Refresh(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockToken.AssertExpectations(t)
}

func TestAuthServiceRefreshErrorGenerate(t *testing.T) {
	mockRepo := new(MockUserRepository)
	mockToken := new(MockToken)
	authService := service.NewAuthService(mockRepo, mockToken)

	req := dto.RefreshTokenRequest{
		RefreshToken: "invalid-refresh-token",
	}

	mockToken.On("ValidateJWT", req.RefreshToken).Return(&config.Claims{Username: "testuser", Email: emailString}, nil)
	mockToken.On("GenerateJWT", "testuser", emailString).Return("", "", assert.AnError)

	res, err := authService.Refresh(req)

	assert.Nil(t, res)
	assert.Error(t, err)
	assert.Equal(t, assert.AnError, err)
	mockToken.AssertExpectations(t)
}
