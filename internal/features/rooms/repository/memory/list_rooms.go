package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *RoomsRepository) ListRooms(ctx context.Context) ([]*domain.Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rooms := make([]*domain.Room, 0, len(r.rooms))
	for _, room := range r.rooms {
		rooms = append(rooms, cloneRoom(room))
	}
	return rooms, nil
}
