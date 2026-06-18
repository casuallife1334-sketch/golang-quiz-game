package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *GameSessionsService) SelectQuestion(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int, price int, question domain.Question) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can select question")
		}

		room.CurrentQuestion = domain.NewCurrentQuestion(categoryIndex, questionIndex, price, question)
		if room.GameMode == domain.GameModeTraining {
			room.TrainingState = &domain.TrainingState{
				QuestionKey:   questionKey(categoryIndex, questionIndex),
				Slide:         0,
				PlayerAnswers: []domain.TrainingAnswer{},
			}
		} else {
			room.TrainingState = nil
		}

		return nil
	})
}
