package service

import (
	"context"
	"crypto/rand"
	"errors"
	"math/big"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

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
