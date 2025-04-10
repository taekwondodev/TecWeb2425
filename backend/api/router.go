package api

import (
	"backend/controller"
	"backend/middleware"
	"net/http"
)

var router *http.ServeMux

func SetupRoutes(authController *controller.AuthController, imageController *controller.MemeController) *http.ServeMux {
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

func setupImageRoutes(imageController *controller.MemeController) {
	// GET all meme
	// GET meme by id
	router.Handle("GET /images/{filename}", imageMiddleware(imageController.GetImage))

	// POST create meme /memes
	// POST create comment /memes/{id}/comments
	router.Handle("POST /images/upload", imageMiddleware(imageController.UploadMeme))

	// PATCH update meme /memes/{id}
	// PATCH downvote meme /memes/{id}
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
