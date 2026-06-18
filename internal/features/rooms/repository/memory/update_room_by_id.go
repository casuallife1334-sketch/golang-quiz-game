package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *RoomsRepository) UpdateRoomByID(ctx context.Context, roomID string, update func(room *domain.Room) error) (*domain.Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	room := r.rooms[roomID]
	if room == nil {
		return nil, ErrRoomNotFound
	}

	next := cloneRoom(room)
	if err := update(next); err != nil {
		return nil, err
	}

	r.rooms[roomID] = cloneRoom(next)
	return cloneRoom(next), nil
}
