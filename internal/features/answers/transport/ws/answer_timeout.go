package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *AnswersWSHandler) AnswerTimeout(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.AnswerTimeout(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "player-answer-result", Payload: map[string]interface{}{
		"playerId":         session.ID(),
		"playerName":       request.PlayerName,
		"isCorrect":        false,
		"correctAnswer":    result.Room.CurrentQuestion.Question.Answer,
		"points":           0,
		"attemptedPlayers": result.AttemptedPlayers,
	}})
	if result.RevealAnswer {
		h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "reveal-answer", Payload: map[string]interface{}{
			"reason":           result.RevealReason,
			"attemptedPlayers": result.AttemptedPlayers,
			"activeAnswererId": result.Room.CurrentQuestion.ActiveAnswererID,
		}})
	}
	return nil
}
