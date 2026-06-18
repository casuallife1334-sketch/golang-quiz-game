package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *GameSessionsService) UpdateScore(ctx context.Context, roomID string, hostID string, playerID string, points int) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can update score")
		}
		if playerID == room.HostID {
			return nil
		}

		room.Scores[playerID] += points
		return nil
	})
}
