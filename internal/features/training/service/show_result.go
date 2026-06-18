package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *TrainingService) ShowResult(ctx context.Context, roomID string, hostID string, questionKey string, correctAnswer string, playerAnswers []domain.TrainingAnswer) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can show training result")
		}

		ensureTrainingState(room, questionKey)
		room.TrainingState.Slide = 2
		room.TrainingState.CorrectAnswer = correctAnswer
		room.TrainingState.PlayerAnswers = playerAnswers
		return nil
	})
}
