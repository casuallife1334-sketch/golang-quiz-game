package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *RoomsService) CreateRoom(ctx context.Context, clientID string, name string, avatar string) (*domain.Room, error) {
	roomID, err := s.createUniqueRoomCode(ctx)
	if err != nil {
		return nil, err
	}

	return s.roomsRepository.CreateRoom(ctx, domain.NewRoom(roomID, domain.Player{
		ID:     clientID,
		Name:   name,
		Avatar: avatar,
	}))
}
