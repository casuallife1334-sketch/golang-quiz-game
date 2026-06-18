package memory

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (r *RoomsRepository) UpdateRooms(ctx context.Context, update func(room *domain.Room) (deleteRoom bool, changed bool, err error)) ([]*domain.Room, []string, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	updatedRooms := []*domain.Room{}
	deletedRoomIDs := []string{}

	for roomID, room := range r.rooms {
		next := cloneRoom(room)
		deleteRoom, changed, err := update(next)
		if err != nil {
			return nil, nil, err
		}
		if deleteRoom {
			delete(r.rooms, roomID)
			deletedRoomIDs = append(deletedRoomIDs, roomID)
			continue
		}
		if changed {
			r.rooms[roomID] = cloneRoom(next)
			updatedRooms = append(updatedRooms, cloneRoom(next))
		}
	}

	return updatedRooms, deletedRoomIDs, nil
}
