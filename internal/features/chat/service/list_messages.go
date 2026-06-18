package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *ChatService) ListMessages(ctx context.Context, roomID string, clientID string) ([]domain.ChatMessage, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}

	for _, player := range room.Players {
		if player.ID == clientID {
			return s.chatRepository.ListMessages(ctx, roomID)
		}
	}

	return nil, errors.New("client is not room member")
}
