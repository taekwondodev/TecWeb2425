package api

import (
	"log"
	"net/http"
)

type Server struct {
	*http.Server
}

func NewServer(addr string, router *http.ServeMux) *Server {
	return &Server{
		Server: &http.Server{
			Addr:    addr,
			Handler: router,
		},
	}
}

func (s *Server) Start() error {
	log.Printf("Server listening on %s", s.Addr)
	return s.ListenAndServe()
}
