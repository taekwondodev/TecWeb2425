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

	router := api.SetupRoutes(authController, memeController)
	server := api.NewServer(":80", router)
	server.StartWithGracefulShutdown()
}
