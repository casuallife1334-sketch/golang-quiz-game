package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *TrainingService) SubmitAnswer(ctx context.Context, roomID string, playerID string, playerName string, questionKey string, answer string, timeTaken int) (*domain.Room, domain.TrainingAnswer, error) {
	var trainingAnswer domain.TrainingAnswer

	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !isNonHostMember(room, playerID) {
			return errors.New("player cannot submit training answer")
		}

		ensureTrainingState(room, questionKey)
		for _, current := range room.TrainingState.PlayerAnswers {
			if current.PlayerID == playerID {
				trainingAnswer = current
				return nil
			}
		}

		trainingAnswer = domain.TrainingAnswer{
			PlayerID:   playerID,
			PlayerName: playerName,
			Answer:     answer,
			TimeTaken:  timeTaken,
			IsCorrect:  nil,
		}
		room.TrainingState.PlayerAnswers = append(room.TrainingState.PlayerAnswers, trainingAnswer)
		return nil
	})
	return updatedRoom, trainingAnswer, err
}
