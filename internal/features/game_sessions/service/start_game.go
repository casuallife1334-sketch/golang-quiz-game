package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *GameSessionsService) StartGame(ctx context.Context, roomID string, hostID string, game domain.Game, gameMode domain.GameMode) (*domain.Room, error) {
	if gameMode == "" {
		gameMode = domain.GameModeCustom
	}

	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can start game")
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
		return nil
	})
}
