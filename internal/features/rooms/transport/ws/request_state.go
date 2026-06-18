package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *RoomsWSHandler) RequestState(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	_ = json.Unmarshal(payload, &request)
	if request.RoomID == "" {
		request.RoomID = session.RoomID()
	}
	if request.RoomID == "" {
		return nil
	}

	room, err := h.roomsService.GetMemberRoom(ctx, request.RoomID, session.ID())
	if err != nil {
		session.Send(realtime.Event{Type: "room-membership-required", Payload: map[string]string{"roomId": request.RoomID}})
		return nil
	}

	h.cancelPendingDisconnect(session.ID())
	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	h.sendReconnectState(session, room)
	return nil
}
