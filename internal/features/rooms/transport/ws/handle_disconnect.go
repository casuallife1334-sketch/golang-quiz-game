package ws

import (
	"context"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
)

func (h *RoomsWSHandler) HandleDisconnect(ctx context.Context, clientID string) {
	disconnectCtx, cancel := context.WithCancel(context.Background())

	h.mu.Lock()
	if previousCancel := h.pendingDisconnects[clientID]; previousCancel != nil {
		previousCancel()
	}
	h.pendingDisconnects[clientID] = cancel
	h.mu.Unlock()

	go h.removePlayerAfterGrace(disconnectCtx, clientID)
}

func (h *RoomsWSHandler) removePlayerAfterGrace(ctx context.Context, clientID string) {
	select {
	case <-ctx.Done():
		return
	case <-time.After(h.disconnectGrace):
	}

	h.mu.Lock()
	if cancel := h.pendingDisconnects[clientID]; cancel != nil {
		delete(h.pendingDisconnects, clientID)
	}
	h.mu.Unlock()

	rooms, err := h.roomsService.RemovePlayerFromAllRooms(ctx, clientID)
	if err != nil {
		return
	}
	for _, room := range rooms {
		h.hub.Broadcast(room.ID, realtime.Event{
			Type: "players-update",
			Payload: map[string]interface{}{
				"players": room.Players,
				"host":    room.HostID,
				"roomId":  room.ID,
			},
		})
	}
}

func (h *RoomsWSHandler) cancelPendingDisconnect(clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	cancel := h.pendingDisconnects[clientID]
	if cancel == nil {
		return
	}

	cancel()
	delete(h.pendingDisconnects, clientID)
}
