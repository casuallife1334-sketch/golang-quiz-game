package logger

import "os"

type Config struct {
	Level  string
	Folder string
}

func NewConfig() Config {
	level := os.Getenv("LOGGER_LEVEL")
	if level == "" {
		level = "DEBUG"
	}

	folder := os.Getenv("LOGGER_FOLDER")
	if folder == "" {
		folder = "logs"
	}

	return Config{
		Level:  level,
		Folder: folder,
	}
}
