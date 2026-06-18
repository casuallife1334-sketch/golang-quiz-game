package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) PlayerWantsAnswer(ctx context.Context, roomID string, playerID string) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !canPlayerAnswer(room, playerID) {
			return errors.New("player cannot answer")
		}
		if room.CurrentQuestion.AttemptedAnswerers[playerID] {
			return errors.New("player already attempted")
		}
		if room.CurrentQuestion.ActiveAnswererID != "" && room.CurrentQuestion.ActiveAnswererID != playerID {
			return errors.New("another player is answering")
		}

		room.CurrentQuestion.ActiveAnswererID = playerID
		return nil
	})
}
