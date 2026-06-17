package service

import (
	"context"
	"crypto/rand"
	"errors"
	"math/big"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

type RoomsRepository interface {
	CreateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error)
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	UpdateRoom(ctx context.Context, room *domain.Room) (*domain.Room, error)
	DeleteRoom(ctx context.Context, roomID string) error
	ListRooms(ctx context.Context) ([]*domain.Room, error)
}

type RoomsService struct {
	roomsRepository RoomsRepository
}

func NewRoomsService(roomsRepository RoomsRepository) *RoomsService {
	return &RoomsService{roomsRepository: roomsRepository}
}

func (s *RoomsService) CreateRoom(ctx context.Context, clientID string, name string, avatar string) (*domain.Room, error) {
	roomID, err := s.createUniqueRoomCode(ctx)
	if err != nil {
		return nil, err
	}

	return s.roomsRepository.CreateRoom(ctx, domain.NewRoom(roomID, domain.Player{
		ID:     clientID,
		Name:   name,
		Avatar: avatar,
	}))
}

func (s *RoomsService) JoinRoom(ctx context.Context, roomID string, clientID string, name string, avatar string) (*domain.Room, error) {
	room, err := s.roomsRepository.GetRoom(ctx, roomID)
	if err != nil {
		return nil, err
	}

	if !hasPlayer(room, clientID) {
		room.Players = append(room.Players, domain.Player{ID: clientID, Name: name, Avatar: avatar})
		if clientID != room.HostID {
			room.Scores[clientID] = 0
		}
	}

	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *RoomsService) RemovePlayerFromAllRooms(ctx context.Context, clientID string) ([]*domain.Room, error) {
	rooms, err := s.roomsRepository.ListRooms(ctx)
	if err != nil {
		return nil, err
	}

	updatedRooms := []*domain.Room{}
	for _, room := range rooms {
		if !hasPlayer(room, clientID) {
			continue
		}

		room.Players = filterPlayers(room.Players, clientID)
		delete(room.Scores, clientID)

		if len(room.Players) == 0 {
			if err := s.roomsRepository.DeleteRoom(ctx, room.ID); err != nil {
				return nil, err
			}
			continue
		}

		if room.HostID == clientID {
			room.HostID = room.Players[0].ID
			delete(room.Scores, room.HostID)
		}

		updatedRoom, err := s.roomsRepository.UpdateRoom(ctx, room)
		if err != nil {
			return nil, err
		}
		updatedRooms = append(updatedRooms, updatedRoom)
	}

	return updatedRooms, nil
}

func (s *RoomsService) GetRoom(ctx context.Context, roomID string) (*domain.Room, error) {
	return s.roomsRepository.GetRoom(ctx, roomID)
}

func (s *RoomsService) SaveRoom(ctx context.Context, room *domain.Room) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoom(ctx, room)
}

func (s *RoomsService) createUniqueRoomCode(ctx context.Context) (string, error) {
	for range 20 {
		code, err := randomRoomCode()
		if err != nil {
			return "", err
		}
		if _, err := s.roomsRepository.GetRoom(ctx, code); err != nil {
			return code, nil
		}
	}

	return "", errors.New("failed to allocate room code")
}

func randomRoomCode() (string, error) {
	const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	code := make([]byte, 4)
	for i := range code {
		n, err := rand.Int(rand.Reader, big.NewInt(int64(len(alphabet))))
		if err != nil {
			return "", err
		}
		code[i] = alphabet[n.Int64()]
	}
	return string(code), nil
}

func hasPlayer(room *domain.Room, playerID string) bool {
	for _, player := range room.Players {
		if player.ID == playerID {
			return true
		}
	}
	return false
}

func filterPlayers(players []domain.Player, playerID string) []domain.Player {
	filtered := make([]domain.Player, 0, len(players))
	for _, player := range players {
		if player.ID != playerID {
			filtered = append(filtered, player)
		}
	}
	return filtered
}
