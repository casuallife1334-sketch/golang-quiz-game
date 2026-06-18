package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *GameSessionsWSHandler) StartGame(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID   string          `json:"roomId"`
		Game     domain.Game     `json:"game"`
		GameMode domain.GameMode `json:"gameMode"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.StartGame(ctx, request.RoomID, session.ID(), request.Game, request.GameMode)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-started", Payload: map[string]interface{}{"game": room.Game, "gameMode": room.GameMode}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	return nil
}
