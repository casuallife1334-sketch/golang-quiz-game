package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *TrainingWSHandler) TrainingShowResult(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID        string                  `json:"roomId"`
		QuestionKey   string                  `json:"questionKey"`
		CorrectAnswer string                  `json:"correctAnswer"`
		PlayerAnswers []domain.TrainingAnswer `json:"playerAnswers"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.trainingService.ShowResult(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.QuestionKey, request.CorrectAnswer, request.PlayerAnswers)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, realtime.Event{Type: "training-show-result", Payload: map[string]interface{}{
		"correctAnswer": request.CorrectAnswer,
		"playerAnswers": request.PlayerAnswers,
	}})
	return nil
}
