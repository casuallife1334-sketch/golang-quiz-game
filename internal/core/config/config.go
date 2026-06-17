package config

import "os"

type Config struct {
	Addr string
}

func New() Config {
	addr := os.Getenv("ADDR")
	if addr == "" {
		addr = ":3001"
	}

	return Config{Addr: addr}
}
