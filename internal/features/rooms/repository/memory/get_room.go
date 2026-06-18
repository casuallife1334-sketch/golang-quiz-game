package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *RoomsRepository) GetRoom(ctx context.Context, roomID string) (*domain.Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	room := r.rooms[roomID]
	if room == nil {
		return nil, ErrRoomNotFound
	}
	return cloneRoom(room), nil
}
