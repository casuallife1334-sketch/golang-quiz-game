package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
	chat_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/service"
)

type ChatService interface {
	BuildMessage(ctx context.Context, roomID string, clientID string, text string) (chat_service.ChatMessage, error)
}

type ChatWSHandler struct {
	chatService ChatService
	hub         *realtime.Hub
}

func NewChatWSHandler(chatService ChatService, hub *realtime.Hub) *ChatWSHandler {
	return &ChatWSHandler{chatService: chatService, hub: hub}
}

func (h *ChatWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{{Type: "chat-message", Handler: h.ChatMessage}}
}

func (h *ChatWSHandler) ChatMessage(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
		Text   string `json:"text"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	message, err := h.chatService.BuildMessage(ctx, request.RoomID, session.ID(), request.Text)
	if err != nil {
		return err
	}

	h.hub.Broadcast(request.RoomID, domain.Event{Type: "chat-message", Payload: message})
	return nil
}
