package api

import (
	"backend/controller"
	"backend/middleware"
	"net/http"
)

var router *http.ServeMux

func SetupRoutes(authController *controller.AuthController, memeController *controller.MemeController) *http.ServeMux {
	router = http.NewServeMux()

	setupAuthRoutes(authController)
	setupMemeRoutes(memeController)

	return router
}

func setupAuthRoutes(authController *controller.AuthController) {
	router.Handle("POST /auth/register", authMiddleware(authController.Register))
	router.Handle("POST /auth/login", authMiddleware(authController.Login))
	router.Handle("POST /auth/refresh", authMiddleware(authController.Refresh))
}

func setupMemeRoutes(memeController *controller.MemeController) {
	// GET all meme
	router.Handle("GET /memes", memeMiddleware(memeController.GetMemes))
	// GET meme by id

	// POST create meme /memes
	router.Handle("POST /memes/upload", memeMiddleware(memeController.UploadMeme))
	// POST create comment /memes/{id}/comments

	// PATCH update meme /memes/{id}
	// PATCH downvote meme /memes/{id}
}

func authMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(h),
	)
}

func memeMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(
			middleware.AuthMiddleware(h),
		),
	)
}
