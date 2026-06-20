package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *RoomsWSHandler) LeaveRoom(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	roomID := request.RoomID
	if roomID == "" {
		roomID = session.RoomID()
	}
	if roomID == "" {
		session.Send(realtime.Event{Type: "left-room", Payload: map[string]string{}})
		return nil
	}

	h.cancelPendingDisconnect(session.ID())
	h.hub.LeaveRoom(roomID, session.ID())
	session.SetRoomID("")

	rooms, err := h.roomsService.RemovePlayerFromAllRooms(ctx, session.ID())
	if err != nil {
		return err
	}

	session.Send(realtime.Event{Type: "left-room", Payload: map[string]string{"roomId": roomID}})
	for _, room := range rooms {
		h.broadcastRoomState(room)
	}
	return nil
}
