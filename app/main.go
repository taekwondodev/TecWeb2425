package main

import (
	"backend/api"
	"backend/config"
	"backend/controller"
	"backend/repository"
	"backend/service"
)

func main() {
	config.LoadEnv()

	config.InitDB()
	defer config.CloseDB()

	authRepo := repository.NewUserRepository(config.Db)
	authService := service.NewAuthService(authRepo, &config.JWT{})
	authController := controller.NewAuthController(authService)

	memeRepo := repository.NewMemeRepository(config.Db)
	memeService := service.NewMemeService(memeRepo)
	memeController := controller.NewMemeController(memeService)

	commentRepo := repository.NewCommentRepository(config.Db)
	commentService := service.NewCommentService(commentRepo)
	commentController := controller.NewCommentController(commentService)

	router := api.SetupRoutes(authController, memeController, commentController)
	server := api.NewServer(":80", router)
	server.StartWithGracefulShutdown()
}
