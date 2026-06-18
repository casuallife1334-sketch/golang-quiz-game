package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *RoomsService) GetRoom(ctx context.Context, roomID string) (*domain.Room, error) {
	return s.roomsRepository.GetRoom(ctx, roomID)
}
