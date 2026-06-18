package config

import (
	"os"
	"strings"
)

type Config struct {
	Addr             string
	WSAllowedOrigins []string
}

func New() Config {
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = "0.0.0.0:3001"
	}

	return Config{
		Addr:             addr,
		WSAllowedOrigins: allowedOrigins(os.Getenv("WS_ALLOWED_ORIGINS")),
	}
}

func allowedOrigins(raw string) []string {
	if raw == "" {
		return []string{
			"http://localhost:5173",
			"http://127.0.0.1:5173",
			"http://localhost:3001",
			"http://127.0.0.1:3001",
		}
	}

	parts := strings.Split(raw, ",")
	origins := make([]string, 0, len(parts))
	for _, part := range parts {
		origin := strings.TrimSpace(part)
		if origin != "" {
			origins = append(origins, origin)
		}
	}
	return origins
}
