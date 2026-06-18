package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *TrainingWSHandler) TrainingSkipIntro(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID      string `json:"roomId"`
		QuestionKey string `json:"questionKey"`
		Slide       int    `json:"slide"`
	}
	_ = json.Unmarshal(payload, &request)
	roomID := fallbackRoomID(request.RoomID, session)
	room, err := h.trainingService.ChangeSlide(ctx, roomID, session.ID(), request.QuestionKey, request.Slide)
	if err != nil {
		return err
	}
	h.hub.BroadcastExcept(room.ID, session.ID(), realtime.Event{Type: "training-skip-intro", Payload: map[string]interface{}{"slide": request.Slide}})
	return nil
}
