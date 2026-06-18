package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *RoomsWSHandler) JoinRoom(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	h.cancelPendingDisconnect(session.ID())

	var request struct {
		RoomID string `json:"roomId"`
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.roomsService.JoinRoom(ctx, request.RoomID, session.ID(), request.Name, request.Avatar)
	if err != nil {
		session.Send(realtime.Event{Type: "error-room", Payload: map[string]string{"message": "Комната не найдена"}})
		return nil
	}

	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	h.broadcastRoomState(room)
	h.sendReconnectState(session, room)
	return nil
}
