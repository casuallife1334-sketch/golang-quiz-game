package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *ChatRepository) AppendMessage(ctx context.Context, roomID string, message domain.ChatMessage, limit int) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.messages[roomID] = append(r.messages[roomID], message)
	if limit > 0 && len(r.messages[roomID]) > limit {
		r.messages[roomID] = r.messages[roomID][len(r.messages[roomID])-limit:]
	}

	return nil
}
