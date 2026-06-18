package service

import (
	"context"
	"errors"
	"strings"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

const maxChatHistory = 100

func (s *ChatService) SaveMessage(ctx context.Context, roomID string, clientID string, text string) (domain.ChatMessage, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return domain.ChatMessage{}, err
	}

	text = strings.TrimSpace(text)
	if text == "" {
		return domain.ChatMessage{}, errors.New("message is empty")
	}
	if len([]rune(text)) > 500 {
		return domain.ChatMessage{}, errors.New("message is too long")
	}

	for _, player := range room.Players {
		if player.ID == clientID {
			now := time.Now().UnixMilli()
			message := domain.ChatMessage{
				ID:          clientID + "-" + time.Now().Format("20060102150405.000"),
				RoomID:      roomID,
				PlayerID:    clientID,
				UserID:      clientID,
				Name:        player.Name,
				Username:    player.Name,
				Avatar:      player.Avatar,
				AvatarColor: avatarColor(clientID),
				Text:        text,
				Time:        time.Now().Format("15:04"),
				Timestamp:   now,
			}

			if err := s.chatRepository.AppendMessage(ctx, roomID, message, maxChatHistory); err != nil {
				return domain.ChatMessage{}, err
			}

			return message, nil
		}
	}

	return domain.ChatMessage{}, errors.New("client is not room member")
}
