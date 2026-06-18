package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) SubmitAnswer(ctx context.Context, roomID string, playerID string, answer string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if !canPlayerAnswer(room, playerID) {
		return nil, errors.New("player cannot answer")
	}
	if room.CurrentQuestion.ActiveAnswererID != playerID {
		return nil, errors.New("not active answerer")
	}
	return room, nil
}
