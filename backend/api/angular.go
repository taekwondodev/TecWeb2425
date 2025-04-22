package api

import (
	"backend/config"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func setupStaticFileServer() {
	dir := getAngularDir()
	fs := http.FileServer(http.Dir(dir))

	uploadsFs := http.StripPrefix("/data/uploads/", http.FileServer(http.Dir(config.UploadDir)))
	router.Handle("GET /data/uploads/", uploadsFs)

	router.Handle("GET /", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handleSPARequests(w, r, dir, fs)
	}))
}

func getAngularDir() string {
	dir := "./static/browser"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		log.Fatalf("Angular static files not found in %s", dir)
	}
	absPath, _ := filepath.Abs(dir)
	return absPath
}

func handleSPARequests(w http.ResponseWriter, r *http.Request, baseDir string, fs http.Handler) {
	log.Printf("Handling request: %s (File: %s)", r.URL.Path, filepath.Join(baseDir, r.URL.Path))
	// Skip API routes
	if strings.HasPrefix(r.URL.Path, "/api") {
		return
	}

	filePath := filepath.Join(baseDir, r.URL.Path)
	if r.URL.Path == "/" {
		filePath = filepath.Join(baseDir, "index.html")
	}

	if _, err := os.Stat(filePath); err == nil {
		fs.ServeHTTP(w, r)
		return
	}

	// Fallback SPA
	http.ServeFile(w, r, filepath.Join(baseDir, "index.html"))
}
