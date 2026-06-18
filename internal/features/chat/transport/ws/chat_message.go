package ws

import (
	"context"
	"encoding/json"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"

	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *ChatWSHandler) ChatMessage(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
		Text   string `json:"text"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	message, err := h.chatService.SaveMessage(ctx, request.RoomID, session.ID(), request.Text)
	if err != nil {
		return err
	}

	h.hub.Broadcast(request.RoomID, realtime.Event{Type: "chat-message", Payload: message})
	return nil
}
