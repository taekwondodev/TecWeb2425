package api

import (
	"backend/controller"
	"backend/middleware"
	"net/http"
)

var router *http.ServeMux

func SetupRoutes(authController *controller.AuthController, memeController *controller.MemeController, commentController *controller.CommentController) *http.ServeMux {
	router = http.NewServeMux()
	publicAuthRoutes(authController)
	publicMemeRoutes(memeController)
	publicCommentRoutes(commentController)
	protectedMemeRoutes(memeController)
	protectedCommentRoutes(commentController)
	setupStaticFileServer()
	return router
}

func publicAuthRoutes(authController *controller.AuthController) {
	router.Handle("POST /api/auth/register", publicMiddleware(authController.Register))
	router.Handle("POST /api/auth/login", publicMiddleware(authController.Login))
	router.Handle("POST /api/auth/refresh", publicMiddleware(authController.Refresh))
}

func publicMemeRoutes(memeController *controller.MemeController) {
	router.Handle("GET /api/memes", publicMiddleware(memeController.GetMemes))
	router.Handle("GET /api/memes/daily", publicMiddleware(memeController.GetDailyMeme))
	router.Handle("GET /api/memes/{id}", publicMiddleware(memeController.GetMemeById))
	router.Handle("GET /api/memes/{memeId}/vote", publicMiddleware(memeController.GetVote))
}

func protectedMemeRoutes(memeController *controller.MemeController) {
	router.Handle("POST /api/memes", protectedMiddleware(memeController.UploadMeme))
	router.Handle("PATCH /api/memes/{memeId}/vote", protectedMiddleware(memeController.VoteMeme))
}

func publicCommentRoutes(commentController *controller.CommentController) {
	router.Handle("GET /api/memes/{memeId}/comments", publicMiddleware(commentController.GetComments))
}

func protectedCommentRoutes(commentController *controller.CommentController) {
	router.Handle("POST /api/memes/{memeId}/comments", protectedMiddleware(commentController.CreateComment))
}

func publicMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(
			middleware.CorsMiddleware(h),
		),
	)
}

func protectedMiddleware(h middleware.HandlerFunc) http.HandlerFunc {
	return middleware.ErrorHandler(
		middleware.LoggingMiddleware(
			middleware.CorsMiddleware(
				middleware.AuthMiddleware(h),
			),
		),
	)
}
