package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *TrainingWSHandler) TrainingSubmitAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID      string `json:"roomId"`
		QuestionKey string `json:"questionKey"`
		Answer      string `json:"answer"`
		TimeTaken   int    `json:"timeTaken"`
		PlayerName  string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, answer, err := h.trainingService.SubmitAnswer(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.PlayerName, request.QuestionKey, request.Answer, request.TimeTaken)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, realtime.Event{Type: "training-player-answer", Payload: answer})
	return nil
}
