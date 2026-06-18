package service

import (
	"context"
	"errors"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) PauseTimer(ctx context.Context, roomID string, playerID string, timeLeft int) (domain.PauseTimerResult, error) {
	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !canPlayerAnswer(room, playerID) {
			return errors.New("player cannot answer")
		}
		if room.CurrentQuestion.AttemptedAnswerers[playerID] {
			return errors.New("already_attempted")
		}
		if room.CurrentQuestion.ActiveAnswererID != "" && room.CurrentQuestion.ActiveAnswererID != playerID {
			return errors.New("another_player_answering")
		}

		now := time.Now().UnixMilli()
		room.CurrentQuestion.ActiveAnswererID = playerID
		room.CurrentQuestion.AttemptedAnswerers[playerID] = true
		room.CurrentQuestion.StoppedTimeLeft = &timeLeft
		room.CurrentQuestion.TimerPausedAt = &now
		return nil
	})
	if err != nil {
		return domain.PauseTimerResult{}, err
	}

	return domain.PauseTimerResult{
		Room:             updatedRoom,
		AttemptedPlayers: attemptedPlayers(updatedRoom),
	}, nil
}
