package middleware

import "net/http"

func TrustProxyMiddleware(next HandlerFunc) HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) error {
		// 1. Check if the request is coming from a trusted proxy
		if proto := r.Header.Get("X-Forwarded-Proto"); proto != "" {
			r.URL.Scheme = proto
		}

		// 2. Fix the host
		if host := r.Header.Get("X-Forwarded-Host"); host != "" {
			r.Host = host
		}

		// 3. Next handler
		return next(w, r)
	}
}

// Chain middleware
func Chain(middlewares ...func(HandlerFunc) HandlerFunc) func(HandlerFunc) HandlerFunc {
	return func(final HandlerFunc) HandlerFunc {
		for i := len(middlewares) - 1; i >= 0; i-- {
			final = middlewares[i](final)
		}
		return final
	}
}
