package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) AnswerTimeout(ctx context.Context, roomID string, playerID string) (domain.VerifyAnswerResult, error) {
	var nextCanStillAnswer bool
	var nextResumedTimerStart *int64

	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if !canPlayerAnswer(room, playerID) {
			return errors.New("player cannot answer")
		}
		if room.CurrentQuestion.ActiveAnswererID != playerID {
			return errors.New("not active answerer")
		}

		room.CurrentQuestion.AttemptedAnswerers[playerID] = true
		room.CurrentQuestion.ActiveAnswererID = ""
		room.CurrentQuestion.TimerPausedAt = nil
		nextResumedTimerStart = resumedTimerStart(room)
		nextCanStillAnswer = canStillAnswer(room)
		return nil
	})
	if err != nil {
		return domain.VerifyAnswerResult{}, err
	}

	return domain.VerifyAnswerResult{
		Room:              updatedRoom,
		AttemptedPlayers:  attemptedPlayers(updatedRoom),
		CanStillAnswer:    nextCanStillAnswer,
		RevealAnswer:      !nextCanStillAnswer,
		RevealReason:      "timeout",
		StoppedTimeLeft:   updatedRoom.CurrentQuestion.StoppedTimeLeft,
		ResumedTimerStart: nextResumedTimerStart,
	}, nil
}
