package service

import (
	"context"
	"errors"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) SubmitAnswer(ctx context.Context, roomID string, playerID string, playerName string, answer string, timeLeft int) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !canPlayerAnswer(room, playerID) {
			return errors.New("player cannot answer")
		}
		if room.CurrentQuestion.ActiveAnswererID != playerID {
			return errors.New("not active answerer")
		}

		now := time.Now().UnixMilli()
		room.CurrentQuestion.PendingAnswer = &domain.PendingAnswer{
			PlayerID:   playerID,
			PlayerName: playerName,
			Answer:     answer,
			TimeLeft:   timeLeft,
			Timestamp:  now,
		}
		room.CurrentQuestion.StoppedTimeLeft = &timeLeft
		room.CurrentQuestion.TimerPausedAt = &now
		return nil
	})
}
