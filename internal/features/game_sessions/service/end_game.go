package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *GameSessionsService) EndGame(ctx context.Context, roomID string, hostID string) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can end game")
		}
		room.GameEnded = true
		room.CurrentQuestion = nil
		return nil
	})
}
