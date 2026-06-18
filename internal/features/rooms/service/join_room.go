package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *RoomsService) JoinRoom(ctx context.Context, roomID string, clientID string, name string, avatar string) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !hasPlayer(room, clientID) {
			room.Players = append(room.Players, domain.Player{ID: clientID, Name: name, Avatar: avatar})
			if clientID != room.HostID {
				room.Scores[clientID] = 0
			}
		}
		return nil
	})
}
