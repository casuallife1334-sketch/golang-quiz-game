package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	UpdateRoomByID(ctx context.Context, roomID string, update func(room *domain.Room) error) (*domain.Room, error)
}

type AnswersService struct {
	roomsRepository RoomsRepository
}

func NewAnswersService(roomsRepository RoomsRepository) *AnswersService {
	return &AnswersService{roomsRepository: roomsRepository}
}
