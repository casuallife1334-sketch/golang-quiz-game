package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *RoomsService) RemovePlayerFromAllRooms(ctx context.Context, clientID string) ([]*domain.Room, error) {
	updatedRooms, deletedRoomIDs, err := s.roomsRepository.UpdateRooms(ctx, func(room *domain.Room) (bool, bool, error) {
		if !hasPlayer(room, clientID) {
			return false, false, nil
		}

		room.Players = filterPlayers(room.Players, clientID)
		delete(room.Scores, clientID)

		if len(room.Players) == 0 {
			return true, false, nil
		}

		if room.HostID == clientID {
			room.HostID = room.Players[0].ID
			delete(room.Scores, room.HostID)
		}

		return false, true, nil
	})
	if err != nil {
		return nil, err
	}

	for _, roomID := range deletedRoomIDs {
		s.notifyRoomDeleted(ctx, roomID)
	}
	return updatedRooms, nil
}
