package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *ChatWSHandler) RequestChatHistory(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	_ = json.Unmarshal(payload, &request)
	if request.RoomID == "" {
		request.RoomID = session.RoomID()
	}
	if request.RoomID == "" {
		return nil
	}

	messages, err := h.chatService.ListMessages(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	session.Send(realtime.Event{Type: "chat-history", Payload: map[string]interface{}{
		"roomId":   request.RoomID,
		"messages": messages,
	}})
	return nil
}
