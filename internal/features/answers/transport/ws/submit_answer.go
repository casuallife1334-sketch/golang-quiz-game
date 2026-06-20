package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	"time"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *AnswersWSHandler) SubmitAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
		Answer     string `json:"answer"`
		TimeLeft   int    `json:"timeLeft"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.answersService.SubmitAnswer(ctx, request.RoomID, session.ID(), request.PlayerName, request.Answer, request.TimeLeft)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "player-answer-submitted", Payload: map[string]interface{}{
		"playerId":   session.ID(),
		"playerName": request.PlayerName,
		"answer":     request.Answer,
		"timeLeft":   request.TimeLeft,
		"timestamp":  time.Now().UnixMilli(),
	}})
	return nil
}
