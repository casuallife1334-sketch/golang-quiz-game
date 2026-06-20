package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	"time"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *AnswersWSHandler) PauseTimer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.PauseTimer(ctx, request.RoomID, session.ID())
	if err != nil {
		session.Send(realtime.Event{Type: "player-answer-rejected", Payload: map[string]interface{}{"playerId": session.ID(), "reason": err.Error()}})
		return nil
	}

	payloadOut := map[string]interface{}{
		"playerId":         session.ID(),
		"playerName":       request.PlayerName,
		"timestamp":        time.Now().UnixMilli(),
		"attemptedPlayers": result.AttemptedPlayers,
	}
	h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "pause-timer", Payload: payloadOut})
	h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "player-answer-request", Payload: map[string]interface{}{
		"playerId":   session.ID(),
		"playerName": request.PlayerName,
		"timestamp":  time.Now().UnixMilli(),
	}})
	return nil
}
