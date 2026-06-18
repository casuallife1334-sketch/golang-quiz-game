package memory

import (
	"sync"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type ChatRepository struct {
	mu       sync.RWMutex
	messages map[string][]domain.ChatMessage
}

func NewChatRepository() *ChatRepository {
	return &ChatRepository{messages: map[string][]domain.ChatMessage{}}
}
