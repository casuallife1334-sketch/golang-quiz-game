package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *AnswersWSHandler) VerifyAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerID   string `json:"playerId"`
		PlayerName string `json:"playerName"`
		IsCorrect  bool   `json:"isCorrect"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.VerifyAnswer(ctx, request.RoomID, session.ID(), request.PlayerID, request.IsCorrect)
	if err != nil {
		return err
	}

	h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "score-update", Payload: map[string]interface{}{"scores": result.Room.Scores}})
	h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "player-answer-result", Payload: map[string]interface{}{
		"playerId":          request.PlayerID,
		"playerName":        request.PlayerName,
		"isCorrect":         request.IsCorrect,
		"correctAnswer":     result.Room.CurrentQuestion.Question.Answer,
		"points":            result.Points,
		"stoppedTimeLeft":   result.StoppedTimeLeft,
		"resumedTimerStart": result.ResumedTimerStart,
		"attemptedPlayers":  result.AttemptedPlayers,
	}})
	if result.RevealAnswer {
		h.hub.Broadcast(result.Room.ID, realtime.Event{Type: "reveal-answer", Payload: map[string]interface{}{
			"reason":           result.RevealReason,
			"attemptedPlayers": result.AttemptedPlayers,
			"stoppedTimeLeft":  result.StoppedTimeLeft,
			"timerPausedAt":    nil,
		}})
	}
	return nil
}
