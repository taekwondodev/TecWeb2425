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
	router.Handle("GET /memes", memeMiddleware(memeController.GetMemes))
	router.Handle("GET /memes/daily", memeMiddleware(memeController.GetDailyMeme))
	router.Handle("POST /memes/upload", memeMiddleware(memeController.UploadMeme))
	router.Handle("POST /memes/comment", memeMiddleware(memeController.CreateComment))
	router.Handle("PATCH /memes/vote", memeMiddleware(memeController.VoteMeme))
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
