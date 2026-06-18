package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *GameSessionsWSHandler) MarkQuestionUsed(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID          string `json:"roomId"`
		CategoryIndex   int    `json:"categoryIndex"`
		QuestionIndex   int    `json:"questionIndex"`
		CorrectPlayerID string `json:"correctPlayerId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, allUsed, err := h.gameSessionsService.MarkQuestionUsed(ctx, request.RoomID, session.ID(), request.CategoryIndex, request.QuestionIndex)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, realtime.Event{Type: "question-marked-used", Payload: map[string]interface{}{
		"categoryIndex":   request.CategoryIndex,
		"questionIndex":   request.QuestionIndex,
		"gameMode":        room.GameMode,
		"game":            room.Game,
		"correctPlayerId": request.CorrectPlayerID,
	}})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	if allUsed {
		h.hub.Broadcast(room.ID, realtime.Event{Type: "game-ended", Payload: map[string]interface{}{
			"scores":   room.Scores,
			"players":  room.Players,
			"gameMode": room.GameMode,
		}})
	}
	return nil
}
