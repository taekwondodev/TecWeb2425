package api

import (
	"backend/controller"
	"backend/middleware"
	"net/http"
)

var router *http.ServeMux

func SetupRoutes(authController *controller.AuthController, memeController *controller.MemeController, commentController *controller.CommentController) *http.ServeMux {
	router = http.NewServeMux()
	setupAuthRoutes(authController)
	setupMemeRoutes(memeController)
	setupCommentRoutes(commentController)
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
	router.Handle("GET /api/memes/id", memeMiddleware(memeController.GetMemeById))
	router.Handle("POST /api/memes/upload", memeMiddleware(memeController.UploadMeme))
	router.Handle("PATCH /api/memes/vote", memeMiddleware(memeController.VoteMeme))
}

func setupCommentRoutes(commentController *controller.CommentController) {
	router.Handle("GET /api/comment", memeMiddleware(commentController.GetComments))
	router.Handle("POST /api/comment", memeMiddleware(commentController.CreateComment))
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
