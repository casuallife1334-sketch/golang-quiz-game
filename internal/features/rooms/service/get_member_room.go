package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *RoomsService) GetMemberRoom(ctx context.Context, roomID string, clientID string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if !hasPlayer(room, clientID) {
		return nil, errors.New("client is not room member")
	}
	return room, nil
}
