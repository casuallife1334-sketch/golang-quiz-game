package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *GameSessionsWSHandler) SelectQuestion(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID        string          `json:"roomId"`
		CategoryIndex int             `json:"categoryIndex"`
		QuestionIndex int             `json:"questionIndex"`
		Price         int             `json:"price"`
		Question      domain.Question `json:"question"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.SelectQuestion(ctx, request.RoomID, session.ID(), request.CategoryIndex, request.QuestionIndex, request.Price, request.Question)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "question-selected", Payload: map[string]interface{}{
		"categoryIndex": room.CurrentQuestion.CategoryIndex,
		"questionIndex": room.CurrentQuestion.QuestionIndex,
		"price":         room.CurrentQuestion.Price,
		"question":      room.CurrentQuestion.Question,
		"timerStart":    room.CurrentQuestion.TimerStart,
		"timerDuration": room.CurrentQuestion.TimerDuration,
		"speechStart":   room.CurrentQuestion.SpeechStart,
		"trainingState": room.TrainingState,
	}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	return nil
}
