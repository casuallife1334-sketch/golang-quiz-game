package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *GameSessionsWSHandler) EndGame(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.EndGame(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "host-end-game", Payload: map[string]interface{}{
		"roomId":   room.ID,
		"endedBy":  session.ID(),
		"scores":   room.Scores,
		"players":  room.Players,
		"gameMode": room.GameMode,
	}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	return nil
}
