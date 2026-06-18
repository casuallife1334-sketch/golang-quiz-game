package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *ChatRepository) ListMessages(ctx context.Context, roomID string) ([]domain.ChatMessage, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	return append([]domain.ChatMessage(nil), r.messages[roomID]...), nil
}
