package ws

import (
	"context"
	"sync"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type RoomsService interface {
	CreateRoom(ctx context.Context, clientID string, name string, avatar string) (*domain.Room, error)
	JoinRoom(ctx context.Context, roomID string, clientID string, name string, avatar string) (*domain.Room, error)
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	GetMemberRoom(ctx context.Context, roomID string, clientID string) (*domain.Room, error)
	RemovePlayerFromAllRooms(ctx context.Context, clientID string) ([]*domain.Room, error)
}

type RoomsWSHandler struct {
	roomsService       RoomsService
	hub                realtime.RoomHub
	disconnectGrace    time.Duration
	pendingDisconnects map[string]context.CancelFunc
	mu                 sync.Mutex
}

func NewRoomsWSHandler(roomsService RoomsService, hub realtime.RoomHub) *RoomsWSHandler {
	return &RoomsWSHandler{
		roomsService:       roomsService,
		hub:                hub,
		disconnectGrace:    30 * time.Second,
		pendingDisconnects: map[string]context.CancelFunc{},
	}
}

func (h *RoomsWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{
			Type:    "create-room",
			Handler: h.CreateRoom,
		},
		{
			Type:    "join-room",
			Handler: h.JoinRoom,
		},
		{
			Type:    "join-room-event",
			Handler: h.RequestState,
		},
		{
			Type:    "request-state",
			Handler: h.RequestState,
		},
	}
}
