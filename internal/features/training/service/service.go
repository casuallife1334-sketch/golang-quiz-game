package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	UpdateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error)
}

type TrainingService struct {
	roomsRepository RoomsRepository
}

func NewTrainingService(roomsRepository RoomsRepository) *TrainingService {
	return &TrainingService{roomsRepository: roomsRepository}
}

func (s *TrainingService) ChangeSlide(ctx context.Context, roomID string, hostID string, questionKey string, slide int) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can change training slide")
	}

	ensureTrainingState(room, questionKey)
	room.TrainingState.Slide = slide
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *TrainingService) SubmitAnswer(ctx context.Context, roomID string, playerID string, playerName string, questionKey string, answer string, timeTaken int) (*domain.Room, domain.TrainingAnswer, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, domain.TrainingAnswer{}, err
	}
	if !isNonHostMember(room, playerID) {
		return nil, domain.TrainingAnswer{}, errors.New("player cannot submit training answer")
	}

	ensureTrainingState(room, questionKey)
	for _, current := range room.TrainingState.PlayerAnswers {
		if current.PlayerID == playerID {
			return room, current, nil
		}
	}

	trainingAnswer := domain.TrainingAnswer{
		PlayerID:   playerID,
		PlayerName: playerName,
		Answer:     answer,
		TimeTaken:  timeTaken,
		IsCorrect:  nil,
	}
	room.TrainingState.PlayerAnswers = append(room.TrainingState.PlayerAnswers, trainingAnswer)

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	return updatedRoom, trainingAnswer, err
}

func (s *TrainingService) VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (*domain.Room, int, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, 0, err
	}
	if room.HostID != hostID {
		return nil, 0, errors.New("only host can verify training answer")
	}
	if room.TrainingState == nil {
		return nil, 0, errors.New("training state is empty")
	}

	for i := range room.TrainingState.PlayerAnswers {
		if room.TrainingState.PlayerAnswers[i].PlayerID == playerID {
			room.TrainingState.PlayerAnswers[i].IsCorrect = &isCorrect
			break
		}
	}

	points := 0
	if isCorrect && playerID != room.HostID {
		points = questionPoints(room)
		room.Scores[playerID] += points
	}

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	return updatedRoom, points, err
}

func (s *TrainingService) ShowResult(ctx context.Context, roomID string, hostID string, questionKey string, correctAnswer string, playerAnswers []domain.TrainingAnswer) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can show training result")
	}

	ensureTrainingState(room, questionKey)
	room.TrainingState.Slide = 2
	room.TrainingState.CorrectAnswer = correctAnswer
	room.TrainingState.PlayerAnswers = playerAnswers
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func ensureTrainingState(room *domain.Room, questionKey string) {
	if questionKey == "" && room.CurrentQuestion != nil {
		questionKey = fmt.Sprintf("%d-%d", room.CurrentQuestion.CategoryIndex, room.CurrentQuestion.QuestionIndex)
	}
	if room.TrainingState == nil {
		room.TrainingState = &domain.TrainingState{
			QuestionKey:   questionKey,
			Slide:         0,
			PlayerAnswers: []domain.TrainingAnswer{},
		}
	}
}

func isNonHostMember(room *domain.Room, playerID string) bool {
	if room == nil || playerID == "" || playerID == room.HostID {
		return false
	}
	for _, player := range room.Players {
		if player.ID == playerID {
			return true
		}
	}
	return false
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
