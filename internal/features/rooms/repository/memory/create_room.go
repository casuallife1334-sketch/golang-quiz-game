package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *RoomsRepository) CreateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.rooms[room.ID] = room
	return cloneRoom(room), nil
}
