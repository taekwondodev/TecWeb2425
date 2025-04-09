package test

import (
	"backend/controller"
	customerrors "backend/customErrors"
	"backend/dto"
	"backend/middleware"
	"bytes"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

const endpointRegisterString = "/register"
const endpointLoginString = "/login"
const endpointRefreshTokenString = "/refresh"
const invalidRefreshTokenString = "invalid-refresh-token"

type MockAuthService struct {
	mock.Mock
}

func (m *MockAuthService) Register(req dto.AuthRequest) (*dto.AuthResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*dto.AuthResponse), args.Error(1)
}

func (m *MockAuthService) Login(req dto.AuthRequest) (*dto.AuthResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*dto.AuthResponse), args.Error(1)
}

func (m *MockAuthService) Refresh(req dto.RefreshTokenRequest) (*dto.AuthResponse, error) {
	args := m.Called(req)
	return args.Get(0).(*dto.AuthResponse), args.Error(1)
}

func (m *MockAuthService) HealthCheck() (*dto.HealthResponse, error) {
	args := m.Called()
	return args.Get(0).(*dto.HealthResponse), args.Error(1)
}

/****************************************************************/

func TestAuthControllerRegisterCorrect(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
		Email:    emailString,
	}

	mockService.On("Register", req).Return(&dto.AuthResponse{Message: "Sign-Up successfully!"}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRegisterString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword", "email":"example@domain.com"}`))

	handler := middleware.ErrorHandler(authController.Register)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.JSONEq(t, `{"message":"Sign-Up successfully!"}`, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRegisterUserAlreadyExist(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
		Email:    emailString,
	}

	mockService.On("Register", req).Return((*dto.AuthResponse)(nil), customerrors.ErrUserAlreadyExists)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRegisterString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword",  "email":"example@domain.com"}`))

	handler := middleware.ErrorHandler(authController.Register)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	expected := `{
        "code": 409,
        "message": "user already exists"
    }`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRegisterEmailAlreadyExist(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
		Email:    emailString,
	}

	mockService.On("Register", req).Return((*dto.AuthResponse)(nil), customerrors.ErrEmailAlreadyExists)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRegisterString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword",  "email":"example@domain.com"}`))

	handler := middleware.ErrorHandler(authController.Register)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusConflict, w.Code)
	expected := `{
        "code": 409,
        "message": "email already exists"
    }`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRegisterInvalidRequest(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRegisterString, bytes.NewBufferString(`invalid-json`))

	handler := middleware.ErrorHandler(authController.Register)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	expected := `{
        "code": 400,
        "message": "bad request"
    }`
	assert.JSONEq(t, expected, w.Body.String())
}

func TestAuthControllerDbError(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
		Email:    emailString,
	}

	mockService.On("Register", req).Return((*dto.AuthResponse)(nil), customerrors.ErrInternalServer)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRegisterString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword",  "email":"example@domain.com"}`))

	handler := middleware.ErrorHandler(authController.Register)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	expected := `{
		"code": 500,
		"message": "internal server error"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

/****************************************************************/

func TestAuthControllerLoginCorrect(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
	}

	mockService.On("Login", req).Return(&dto.AuthResponse{Message: "Login successful!"}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointLoginString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword"}`))

	handler := middleware.ErrorHandler(authController.Login)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.JSONEq(t, `{"message":"Login successful!"}`, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerLoginInvalidCredentials(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
	}

	mockService.On("Login", req).Return((*dto.AuthResponse)(nil), customerrors.ErrInvalidCredentials)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointLoginString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword"}`))

	handler := middleware.ErrorHandler(authController.Login)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	expected := `{
		"code": 401,
		"message": "invalid credentials"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerLoginUserNotFound(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
	}

	mockService.On("Login", req).Return((*dto.AuthResponse)(nil), customerrors.ErrUserNotFound)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointLoginString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword"}`))

	handler := middleware.ErrorHandler(authController.Login)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusNotFound, w.Code)
	expected := `{
		"code": 404,
		"message": "user not found"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerLoginInvalidRequest(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointLoginString, bytes.NewBufferString(`invalid-json`))

	handler := middleware.ErrorHandler(authController.Login)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	expected := `{
		"code": 400,
		"message": "bad request"
	}`
	assert.JSONEq(t, expected, w.Body.String())
}

func TestAuthControllerLoginJWTError(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.AuthRequest{
		Username: "testuser",
		Password: "testpassword",
	}

	mockService.On("Login", req).Return((*dto.AuthResponse)(nil), customerrors.ErrInternalServer)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointLoginString, bytes.NewBufferString(`{"username":"testuser","password":"testpassword"}`))

	handler := middleware.ErrorHandler(authController.Login)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	expected := `{
		"code": 500,
		"message": "internal server error"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

/****************************************************************/

func TestAuthControllerRefreshTokenCorrect(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.RefreshTokenRequest{
		RefreshToken: "valid-refresh-token",
	}

	mockService.On("Refresh", req).Return(&dto.AuthResponse{Message: "Token refreshed successfully!"}, nil)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRefreshTokenString, bytes.NewBufferString(`{"refreshToken":"valid-refresh-token"}`))

	handler := middleware.ErrorHandler(authController.Refresh)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.JSONEq(t, `{"message":"Token refreshed successfully!"}`, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRefreshTokenUnauthorized(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.RefreshTokenRequest{
		RefreshToken: invalidRefreshTokenString,
	}

	mockService.On("Refresh", req).Return((*dto.AuthResponse)(nil), customerrors.ErrInternalServer)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRefreshTokenString, bytes.NewBufferString(`{"refreshToken":"invalid-refresh-token"}`))

	handler := middleware.ErrorHandler(authController.Refresh)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
	expected := `{
		"code": 500,
		"message": "internal server error"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRefreshTokenInvalidRequest(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRefreshTokenString, bytes.NewBufferString(`invalid-json`))

	handler := middleware.ErrorHandler(authController.Refresh)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	expected := `{
		"code": 400,
		"message": "bad request"
	}`
	assert.JSONEq(t, expected, w.Body.String())
}

func TestAuthControllerRefreshTokenExpired(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.RefreshTokenRequest{
		RefreshToken: invalidRefreshTokenString,
	}

	mockService.On("Refresh", req).Return((*dto.AuthResponse)(nil), jwt.ErrTokenExpired)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRefreshTokenString, bytes.NewBufferString(`{"refreshToken":"invalid-refresh-token"}`))

	handler := middleware.ErrorHandler(authController.Refresh)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	expected := `{
		"code": 401,
		"message": "token is expired"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}

func TestAuthControllerRefreshTokenNotValid(t *testing.T) {
	mockService := new(MockAuthService)
	authController := controller.NewAuthController(mockService)

	req := dto.RefreshTokenRequest{
		RefreshToken: invalidRefreshTokenString,
	}

	mockService.On("Refresh", req).Return((*dto.AuthResponse)(nil), jwt.ErrSignatureInvalid)

	w := httptest.NewRecorder()
	r := httptest.NewRequest(http.MethodPost, endpointRefreshTokenString, bytes.NewBufferString(`{"refreshToken":"invalid-refresh-token"}`))

	handler := middleware.ErrorHandler(authController.Refresh)
	handler.ServeHTTP(w, r)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
	expected := `{
		"code": 401,
		"message": "signature is invalid"
	}`
	assert.JSONEq(t, expected, w.Body.String())
	mockService.AssertExpectations(t)
}
