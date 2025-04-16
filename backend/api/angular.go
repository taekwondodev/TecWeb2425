package api

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func setupStaticFileServer() {
	dir := getAngularDir()
	fs := http.FileServer(http.Dir(dir))

	assetsFs := http.StripPrefix("/assets/", http.FileServer(http.Dir(filepath.Join(dir, "assets"))))
	router.Handle("GET /assets/", assetsFs)

	router.Handle("GET /", http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handleSPARequests(w, r, dir, fs)
	}))
}

func getAngularDir() string {
	dir := "./static"
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		log.Fatalf("Angular static files not found in %s", dir)
	}
	absPath, _ := filepath.Abs(dir)
	return absPath
}

func handleSPARequests(w http.ResponseWriter, r *http.Request, baseDir string, fs http.Handler) {
	// Skip API routes
	if strings.HasPrefix(r.URL.Path, "/api") {
		return
	}

	// Gestione file fisici
	filePath := filepath.Join(baseDir, r.URL.Path)
	if _, err := os.Stat(filePath); err == nil && r.URL.Path != "/" {
		fs.ServeHTTP(w, r)
		return
	}

	// Fallback SPA
	http.ServeFile(w, r, filepath.Join(baseDir, "index.html"))
}
