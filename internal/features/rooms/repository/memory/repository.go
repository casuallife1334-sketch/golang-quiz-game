package memory

import (
	"errors"
	"sync"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

var ErrRoomNotFound = errors.New("room not found")

type RoomsRepository struct {
	mu    sync.RWMutex
	rooms map[string]*domain.Room
}

func NewRoomsRepository() *RoomsRepository {
	return &RoomsRepository{rooms: map[string]*domain.Room{}}
}
