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
	setupStaticFileServer()
	return router
}

func setupAuthRoutes(authController *controller.AuthController) {
	router.Handle("POST /api/auth/register", authMiddleware(authController.Register))
	router.Handle("POST /api/auth/login", authMiddleware(authController.Login))
	router.Handle("POST /api/auth/refresh", authMiddleware(authController.Refresh))
}

func setupMemeRoutes(memeController *controller.MemeController) {
	router.Handle("GET /api/memes", memeMiddleware(memeController.GetMemes))
	router.Handle("GET /api/memes/daily", memeMiddleware(memeController.GetDailyMeme))
	router.Handle("POST /api/memes/upload", memeMiddleware(memeController.UploadMeme))
	router.Handle("POST /api/memes/comment", memeMiddleware(memeController.CreateComment))
	router.Handle("PATCH /api/memes/vote", memeMiddleware(memeController.VoteMeme))
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
