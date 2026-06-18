package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *TrainingService) EndGame(ctx context.Context, roomID string, hostID string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can end training game")
	}

	return room, nil
}
