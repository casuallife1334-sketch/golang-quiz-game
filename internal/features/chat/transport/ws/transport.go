package ws

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type ChatService interface {
	SaveMessage(ctx context.Context, roomID string, clientID string, text string) (domain.ChatMessage, error)
	ListMessages(ctx context.Context, roomID string, clientID string) ([]domain.ChatMessage, error)
}

type ChatWSHandler struct {
	chatService ChatService
	hub         realtime.RoomHub
}

func NewChatWSHandler(chatService ChatService, hub realtime.RoomHub) *ChatWSHandler {
	return &ChatWSHandler{chatService: chatService, hub: hub}
}

func (h *ChatWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{
			Type:    "chat-message",
			Handler: h.ChatMessage,
		},
		{
			Type:    "request-chat-history",
			Handler: h.RequestChatHistory,
		},
	}
}
