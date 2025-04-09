package api

import (
	"backend/controller"
	"backend/middleware"
	"net/http"
)

var router *http.ServeMux

func SetupRoutes(authController *controller.AuthController, imageController *controller.ImageController) *http.ServeMux {
	router = http.NewServeMux()

	setupAuthRoutes(authController)
	setupImageRoutes(imageController)

	return router
}

func setupAuthRoutes(authController *controller.AuthController) {
	router.Handle("POST /auth/register", authMiddleware(authController.Register))
	router.Handle("POST /auth/login", authMiddleware(authController.Login))
	router.Handle("POST /auth/refresh", authMiddleware(authController.Refresh))
}

func setupImageRoutes(imageController *controller.ImageController) {
	router.Handle("GET /images/{filename}", imageMiddleware(imageController.GetImage))
	router.Handle("POST /images/upload", imageMiddleware(imageController.UploadImage))
}

func authMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(h),
	)
}

func imageMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(
			middleware.AuthMiddleware(h),
		),
	)
}
