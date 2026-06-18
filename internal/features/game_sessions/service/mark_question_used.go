package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *GameSessionsService) MarkQuestionUsed(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int) (*domain.Room, bool, error) {
	key := questionKey(categoryIndex, questionIndex)
	allUsed := false

	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can mark question used")
		}

		if !contains(room.UsedQuestions, key) {
			room.UsedQuestions = append(room.UsedQuestions, key)
		}
		room.CurrentQuestion = nil
		allUsed = allQuestionsUsed(room)
		if allUsed {
			room.GameEnded = true
		}
		return nil
	})
	return updatedRoom, allUsed, err
}
