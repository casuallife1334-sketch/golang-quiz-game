package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *GameSessionsWSHandler) UpdateScore(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID   string `json:"roomId"`
		PlayerID string `json:"playerId"`
		Points   int    `json:"points"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.UpdateScore(ctx, request.RoomID, session.ID(), request.PlayerID, request.Points)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	return nil
}
