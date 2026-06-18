package service

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
}

type ChatRepository interface {
	AppendMessage(ctx context.Context, roomID string, message domain.ChatMessage, limit int) error
	ListMessages(ctx context.Context, roomID string) ([]domain.ChatMessage, error)
	DeleteMessages(ctx context.Context, roomID string) error
}

type ChatService struct {
	roomsRepository RoomsRepository
	chatRepository  ChatRepository
}

func NewChatService(roomsRepository RoomsRepository, chatRepository ChatRepository) *ChatService {
	return &ChatService{
		roomsRepository: roomsRepository,
		chatRepository:  chatRepository,
	}
}
