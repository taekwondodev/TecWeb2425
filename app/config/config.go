package config

import (
	"fmt"
	"log"
	"os"
)

var JwtSecret []byte
var DbURL string
var DbConnStr string
var UploadDir string

const MaxFileSize int64 = 10 << 20 // 10MB
var AllowedTypes []string = []string{"image/jpeg", "image/png", "image/gif"}

func LoadEnv() {
	jwtSecret := os.Getenv("JWT_SECRET")
	if jwtSecret == "" {
		log.Fatal("JWT_SECRET not defined")
	}
	JwtSecret = []byte(jwtSecret)

	DbConnStr = fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_PORT"),
		os.Getenv("POSTGRES_USER"),
		os.Getenv("POSTGRES_PASSWORD"),
		os.Getenv("POSTGRES_DB"),
		"disable",
	)
	if DbConnStr == "" {
		log.Fatal("DB connection string not defined")
	}

	UploadDir = os.Getenv("UPLOAD_DIR")
	if UploadDir == "" {
		UploadDir = "/data/uploads"
	}
}
