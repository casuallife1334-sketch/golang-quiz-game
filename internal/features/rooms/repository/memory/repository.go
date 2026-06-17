package memory

import (
	"context"
	"errors"
	"sync"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

var ErrRoomNotFound = errors.New("room not found")

type RoomsRepository struct {
	mu    sync.RWMutex
	rooms map[string]*domain.Room
}

func NewRoomsRepository() *RoomsRepository {
	return &RoomsRepository{rooms: map[string]*domain.Room{}}
}

func (r *RoomsRepository) CreateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	r.rooms[room.ID] = room
	return cloneRoom(room), nil
}

func (r *RoomsRepository) GetRoom(ctx context.Context, roomID string) (*domain.Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	room := r.rooms[roomID]
	if room == nil {
		return nil, ErrRoomNotFound
	}
	return cloneRoom(room), nil
}

func (r *RoomsRepository) UpdateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error) {
	r.mu.Lock()
	defer r.mu.Unlock()

	if r.rooms[room.ID] == nil {
		return nil, ErrRoomNotFound
	}
	r.rooms[room.ID] = cloneRoom(room)
	return cloneRoom(room), nil
}

func (r *RoomsRepository) DeleteRoom(ctx context.Context, roomID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.rooms, roomID)
	return nil
}

func (r *RoomsRepository) ListRooms(ctx context.Context) ([]*domain.Room, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()

	rooms := make([]*domain.Room, 0, len(r.rooms))
	for _, room := range r.rooms {
		rooms = append(rooms, cloneRoom(room))
	}
	return rooms, nil
}

func cloneRoom(room *domain.Room) *domain.Room {
	if room == nil {
		return nil
	}

	clone := *room
	clone.Players = append([]domain.Player(nil), room.Players...)
	clone.UsedQuestions = append([]string(nil), room.UsedQuestions...)
	clone.Scores = map[string]int{}
	for playerID, score := range room.Scores {
		clone.Scores[playerID] = score
	}
	if room.CurrentQuestion != nil {
		current := *room.CurrentQuestion
		current.AttemptedAnswerers = map[string]bool{}
		for playerID, attempted := range room.CurrentQuestion.AttemptedAnswerers {
			current.AttemptedAnswerers[playerID] = attempted
		}
		clone.CurrentQuestion = &current
	}
	if room.TrainingState != nil {
		training := *room.TrainingState
		training.PlayerAnswers = append([]domain.TrainingAnswer(nil), room.TrainingState.PlayerAnswers...)
		clone.TrainingState = &training
	}
	if room.Meta != nil {
		clone.Meta = map[string]interface{}{}
		for key, value := range room.Meta {
			clone.Meta[key] = value
		}
	}
	return &clone
}
