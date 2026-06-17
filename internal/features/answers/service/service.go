package service

import (
	"context"
	"errors"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	UpdateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error)
}

type AnswersService struct {
	roomsRepository RoomsRepository
}

type PauseTimerResult struct {
	Room             *domain.Room
	AttemptedPlayers []string
}

type VerifyAnswerResult struct {
	Room              *domain.Room
	Points            int
	AttemptedPlayers  []string
	CanStillAnswer    bool
	RevealAnswer      bool
	RevealReason      string
	StoppedTimeLeft   *int
	ResumedTimerStart *int64
}

func NewAnswersService(roomsRepository RoomsRepository) *AnswersService {
	return &AnswersService{roomsRepository: roomsRepository}
}

func (s *AnswersService) PlayerWantsAnswer(ctx context.Context, roomID string, playerID string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if !canPlayerAnswer(room, playerID) {
		return nil, errors.New("player cannot answer")
	}
	if room.CurrentQuestion.AttemptedAnswerers[playerID] {
		return nil, errors.New("player already attempted")
	}
	if room.CurrentQuestion.ActiveAnswererID != "" && room.CurrentQuestion.ActiveAnswererID != playerID {
		return nil, errors.New("another player is answering")
	}

	room.CurrentQuestion.ActiveAnswererID = playerID
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *AnswersService) PauseTimer(ctx context.Context, roomID string, playerID string, timeLeft int) (PauseTimerResult, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return PauseTimerResult{}, err
	}
	if !canPlayerAnswer(room, playerID) {
		return PauseTimerResult{}, errors.New("player cannot answer")
	}
	if room.CurrentQuestion.AttemptedAnswerers[playerID] {
		return PauseTimerResult{}, errors.New("already_attempted")
	}
	if room.CurrentQuestion.ActiveAnswererID != "" && room.CurrentQuestion.ActiveAnswererID != playerID {
		return PauseTimerResult{}, errors.New("another_player_answering")
	}

	now := time.Now().UnixMilli()
	room.CurrentQuestion.ActiveAnswererID = playerID
	room.CurrentQuestion.AttemptedAnswerers[playerID] = true
	room.CurrentQuestion.StoppedTimeLeft = &timeLeft
	room.CurrentQuestion.TimerPausedAt = &now

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	if err != nil {
		return PauseTimerResult{}, err
	}

	return PauseTimerResult{
		Room:             updatedRoom,
		AttemptedPlayers: attemptedPlayers(updatedRoom),
	}, nil
}

func (s *AnswersService) SubmitAnswer(ctx context.Context, roomID string, playerID string, answer string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if !canPlayerAnswer(room, playerID) {
		return nil, errors.New("player cannot answer")
	}
	if room.CurrentQuestion.ActiveAnswererID != playerID {
		return nil, errors.New("not active answerer")
	}
	return room, nil
}

func (s *AnswersService) AnswerTimeout(ctx context.Context, roomID string, playerID string) (VerifyAnswerResult, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return VerifyAnswerResult{}, err
	}
	if !canPlayerAnswer(room, playerID) {
		return VerifyAnswerResult{}, errors.New("player cannot answer")
	}
	if room.CurrentQuestion.ActiveAnswererID != playerID {
		return VerifyAnswerResult{}, errors.New("not active answerer")
	}

	room.CurrentQuestion.AttemptedAnswerers[playerID] = true
	room.CurrentQuestion.ActiveAnswererID = ""
	room.CurrentQuestion.TimerPausedAt = nil
	resumedTimerStart := resumedTimerStart(room)
	canStillAnswer := canStillAnswer(room)

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	if err != nil {
		return VerifyAnswerResult{}, err
	}

	return VerifyAnswerResult{
		Room:              updatedRoom,
		AttemptedPlayers:  attemptedPlayers(updatedRoom),
		CanStillAnswer:    canStillAnswer,
		RevealAnswer:      !canStillAnswer,
		RevealReason:      "timeout",
		StoppedTimeLeft:   updatedRoom.CurrentQuestion.StoppedTimeLeft,
		ResumedTimerStart: resumedTimerStart,
	}, nil
}

func (s *AnswersService) VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (VerifyAnswerResult, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return VerifyAnswerResult{}, err
	}
	if room.HostID != hostID {
		return VerifyAnswerResult{}, errors.New("only host can verify answer")
	}
	if room.CurrentQuestion == nil {
		return VerifyAnswerResult{}, errors.New("question is not active")
	}

	points := questionPoints(room)
	appliedPoints := -points
	if isCorrect {
		appliedPoints = points
	}
	if playerID != room.HostID {
		room.Scores[playerID] += appliedPoints
	}

	room.CurrentQuestion.ActiveAnswererID = ""
	room.CurrentQuestion.TimerPausedAt = nil
	canStillAnswer := canStillAnswer(room)
	revealAnswer := isCorrect || !canStillAnswer
	reason := ""
	if isCorrect {
		reason = "correct_answer"
	} else if !canStillAnswer {
		reason = "all_incorrect"
	}

	var resumed *int64
	if canStillAnswer && !isCorrect {
		resumed = resumedTimerStart(room)
	}

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	if err != nil {
		return VerifyAnswerResult{}, err
	}

	return VerifyAnswerResult{
		Room:              updatedRoom,
		Points:            appliedPoints,
		AttemptedPlayers:  attemptedPlayers(updatedRoom),
		CanStillAnswer:    canStillAnswer,
		RevealAnswer:      revealAnswer,
		RevealReason:      reason,
		StoppedTimeLeft:   updatedRoom.CurrentQuestion.StoppedTimeLeft,
		ResumedTimerStart: resumed,
	}, nil
}

func canPlayerAnswer(room *domain.Room, playerID string) bool {
	if room == nil || room.CurrentQuestion == nil || playerID == "" || playerID == room.HostID {
		return false
	}
	for _, player := range room.Players {
		if player.ID == playerID {
			return true
		}
	}
	return false
}

func attemptedPlayers(room *domain.Room) []string {
	if room == nil || room.CurrentQuestion == nil {
		return []string{}
	}
	players := make([]string, 0, len(room.CurrentQuestion.AttemptedAnswerers))
	for playerID := range room.CurrentQuestion.AttemptedAnswerers {
		players = append(players, playerID)
	}
	return players
}

func canStillAnswer(room *domain.Room) bool {
	if room == nil || room.CurrentQuestion == nil {
		return false
	}
	for _, player := range room.Players {
		if player.ID != room.HostID && !room.CurrentQuestion.AttemptedAnswerers[player.ID] {
			return true
		}
	}
	return false
}

func resumedTimerStart(room *domain.Room) *int64 {
	if room == nil || room.CurrentQuestion == nil || room.CurrentQuestion.StoppedTimeLeft == nil {
		return nil
	}

	value := time.Now().UnixMilli() - int64((room.CurrentQuestion.TimerDuration-*room.CurrentQuestion.StoppedTimeLeft)*1000)
	return &value
}

func questionPoints(room *domain.Room) int {
	if room == nil || room.CurrentQuestion == nil {
		return 0
	}
	if room.CurrentQuestion.Question.Price > 0 {
		return room.CurrentQuestion.Question.Price
	}
	if room.CurrentQuestion.Price > 0 {
		return room.CurrentQuestion.Price
	}
	return 100
}
