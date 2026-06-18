package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *TrainingService) VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (*domain.Room, int, error) {
	points := 0

	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can verify training answer")
		}
		if room.TrainingState == nil {
			return errors.New("training state is empty")
		}

		found := false
		for i := range room.TrainingState.PlayerAnswers {
			if room.TrainingState.PlayerAnswers[i].PlayerID == playerID {
				found = true
				wasCorrect := room.TrainingState.PlayerAnswers[i].IsCorrect != nil && *room.TrainingState.PlayerAnswers[i].IsCorrect
				room.TrainingState.PlayerAnswers[i].IsCorrect = &isCorrect
				if isCorrect && !wasCorrect && playerID != room.HostID {
					points = questionPoints(room)
					room.Scores[playerID] += points
				}
				break
			}
		}
		if !found {
			return errors.New("training answer not found")
		}

		return nil
	})
	return updatedRoom, points, err
}
