package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *RoomsWSHandler) CreateRoom(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	h.cancelPendingDisconnect(session.ID())

	var request struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.roomsService.CreateRoom(ctx, session.ID(), request.Name, request.Avatar)
	if err != nil {
		return err
	}

	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	session.Send(realtime.Event{Type: "room-created", Payload: map[string]string{"roomId": room.ID}})
	h.broadcastRoomState(room)
	return nil
}
