package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	CreateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error)
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	UpdateRoomByID(ctx context.Context, roomID string, update func(room *domain.Room) error) (*domain.Room, error)
	UpdateRooms(ctx context.Context, update func(room *domain.Room) (deleteRoom bool, changed bool, err error)) ([]*domain.Room, []string, error)
	ListRooms(ctx context.Context) ([]*domain.Room, error)
}

type RoomLifecycleObserver interface {
	RoomDeleted(ctx context.Context, roomID string)
}

type RoomsService struct {
	roomsRepository RoomsRepository
	observers       []RoomLifecycleObserver
}

func NewRoomsService(roomsRepository RoomsRepository, observers ...RoomLifecycleObserver) *RoomsService {
	return &RoomsService{
		roomsRepository: roomsRepository,
		observers:       observers,
	}
}
