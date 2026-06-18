package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *TrainingWSHandler) TrainingVerifyAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID    string `json:"roomId"`
		PlayerID  string `json:"playerId"`
		IsCorrect bool   `json:"isCorrect"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, points, err := h.trainingService.VerifyAnswer(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.PlayerID, request.IsCorrect)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, realtime.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "training-answer-verified", Payload: map[string]interface{}{
		"playerId":  request.PlayerID,
		"isCorrect": request.IsCorrect,
		"points":    points,
	}})
	return nil
}
