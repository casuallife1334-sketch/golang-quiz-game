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

type GameSessionsService struct {
	roomsRepository RoomsRepository
}

func NewGameSessionsService(roomsRepository RoomsRepository) *GameSessionsService {
	return &GameSessionsService{roomsRepository: roomsRepository}
}

func (s *GameSessionsService) StartGame(ctx context.Context, roomID string, hostID string, game domain.Game, gameMode domain.GameMode) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can start game")
	}
	if gameMode == "" {
		gameMode = domain.GameModeCustom
	}

	room.Game = &game
	room.GameMode = gameMode
	room.UsedQuestions = []string{}
	room.CurrentQuestion = nil
	room.GameEnded = false
	room.TrainingState = nil
	room.Scores = map[string]int{}
	for _, player := range room.Players {
		if player.ID != room.HostID {
			room.Scores[player.ID] = 0
		}
	}

	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *GameSessionsService) SelectQuestion(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int, price int, question domain.Question) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can select question")
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

	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *GameSessionsService) MarkQuestionUsed(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int) (*domain.Room, bool, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, false, err
	}
	if room.HostID != hostID {
		return nil, false, errors.New("only host can mark question used")
	}

	key := questionKey(categoryIndex, questionIndex)
	if !contains(room.UsedQuestions, key) {
		room.UsedQuestions = append(room.UsedQuestions, key)
	}
	room.CurrentQuestion = nil
	allUsed := allQuestionsUsed(room)
	if allUsed {
		room.GameEnded = true
	}

	updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
	return updatedRoom, allUsed, err
}

func (s *GameSessionsService) UpdateScore(ctx context.Context, roomID string, hostID string, playerID string, points int) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can update score")
	}
	if playerID == room.HostID {
		return room, nil
	}

	room.Scores[playerID] += points
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *GameSessionsService) EndGame(ctx context.Context, roomID string, hostID string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}
	if room.HostID != hostID {
		return nil, errors.New("only host can end game")
	}
	room.GameEnded = true
	room.CurrentQuestion = nil
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func questionKey(categoryIndex int, questionIndex int) string {
	return fmt.Sprintf("%d-%d", categoryIndex, questionIndex)
}

func contains(values []string, value string) bool {
	for _, current := range values {
		if current == value {
			return true
		}
	}
	return false
}

func allQuestionsUsed(room *domain.Room) bool {
	if room.Game == nil {
		return false
	}

	total := 0
	for categoryIndex, category := range room.Game.Categories {
		for questionIndex := range category.Questions {
			total++
			if !contains(room.UsedQuestions, questionKey(categoryIndex, questionIndex)) {
				return false
			}
		}
	}
	return total > 0
}
