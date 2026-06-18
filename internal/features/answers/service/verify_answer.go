package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *AnswersService) VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (domain.VerifyAnswerResult, error) {
	var appliedPoints int
	var nextCanStillAnswer bool
	var revealAnswer bool
	var reason string
	var resumed *int64

	updatedRoom, err := s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can verify answer")
		}
		if room.CurrentQuestion == nil {
			return errors.New("question is not active")
		}

		points := questionPoints(room)
		appliedPoints = -points
		if isCorrect {
			appliedPoints = points
		}
		if playerID != room.HostID {
			room.Scores[playerID] += appliedPoints
		}

		room.CurrentQuestion.ActiveAnswererID = ""
		room.CurrentQuestion.TimerPausedAt = nil
		nextCanStillAnswer = canStillAnswer(room)
		revealAnswer = isCorrect || !nextCanStillAnswer
		reason = ""
		if isCorrect {
			reason = "correct_answer"
		} else if !nextCanStillAnswer {
			reason = "all_incorrect"
		}

		if nextCanStillAnswer && !isCorrect {
			resumed = resumedTimerStart(room)
		}
		return nil
	})
	if err != nil {
		return domain.VerifyAnswerResult{}, err
	}

	return domain.VerifyAnswerResult{
		Room:              updatedRoom,
		Points:            appliedPoints,
		AttemptedPlayers:  attemptedPlayers(updatedRoom),
		CanStillAnswer:    nextCanStillAnswer,
		RevealAnswer:      revealAnswer,
		RevealReason:      reason,
		StoppedTimeLeft:   updatedRoom.CurrentQuestion.StoppedTimeLeft,
		ResumedTimerStart: resumed,
	}, nil
}
