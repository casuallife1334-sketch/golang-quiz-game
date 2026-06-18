package service

import "fmt"

func avatarColor(id string) string {
	hash := 0
	for _, char := range id {
		hash = int(char) + ((hash << 5) - hash)
	}
	if hash < 0 {
		hash = -hash
	}
	return fmt.Sprintf("hsl(%d, 70%%, 60%%)", hash%360)
}
