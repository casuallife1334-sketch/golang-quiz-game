package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *TrainingWSHandler) TrainingGameEnd(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	_ = json.Unmarshal(payload, &request)
	roomID := fallbackRoomID(request.RoomID, session)
	room, err := h.trainingService.EndGame(ctx, roomID, session.ID())
	if err != nil {
		return err
	}
	h.hub.BroadcastExcept(room.ID, session.ID(), realtime.Event{Type: "training-game-end"})
	return nil
}
