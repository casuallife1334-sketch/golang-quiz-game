package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
}

type ChatService struct {
	roomsRepository RoomsRepository
}

type ChatMessage struct {
	ID        string `json:"id"`
	RoomID    string `json:"roomId"`
	PlayerID  string `json:"playerId"`
	Name      string `json:"name"`
	Avatar    string `json:"avatar"`
	Text      string `json:"text"`
	Timestamp int64  `json:"timestamp"`
}

func NewChatService(roomsRepository RoomsRepository) *ChatService {
	return &ChatService{roomsRepository: roomsRepository}
}

func (s *ChatService) BuildMessage(ctx context.Context, roomID string, clientID string, text string) (ChatMessage, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return ChatMessage{}, err
	}

	text = strings.TrimSpace(text)
	if text == "" {
		return ChatMessage{}, errors.New("message is empty")
	}
	if len([]rune(text)) > 500 {
		return ChatMessage{}, errors.New("message is too long")
	}

	for _, player := range room.Players {
		if player.ID == clientID {
			now := time.Now().UnixMilli()
			return ChatMessage{
				ID:        clientID + "-" + time.Now().Format("20060102150405.000"),
				RoomID:    roomID,
				PlayerID:  clientID,
				Name:      player.Name,
				Avatar:    player.Avatar,
				Text:      text,
				Timestamp: now,
			}, nil
		}
	}

	return ChatMessage{}, errors.New("client is not room member")
}
