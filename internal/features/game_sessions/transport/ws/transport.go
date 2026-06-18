package ws

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type GameSessionsService interface {
	StartGame(ctx context.Context, roomID string, hostID string, game domain.Game, gameMode domain.GameMode) (*domain.Room, error)
	SelectQuestion(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int, price int, question domain.Question) (*domain.Room, error)
	MarkQuestionUsed(ctx context.Context, roomID string, hostID string, categoryIndex int, questionIndex int) (*domain.Room, bool, error)
	UpdateScore(ctx context.Context, roomID string, hostID string, playerID string, points int) (*domain.Room, error)
	EndGame(ctx context.Context, roomID string, hostID string) (*domain.Room, error)
}

type GameSessionsWSHandler struct {
	gameSessionsService GameSessionsService
	hub                 realtime.RoomHub
}

func NewGameSessionsWSHandler(gameSessionsService GameSessionsService, hub realtime.RoomHub) *GameSessionsWSHandler {
	return &GameSessionsWSHandler{gameSessionsService: gameSessionsService, hub: hub}
}

func (h *GameSessionsWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{
			Type:    "start-game",
			Handler: h.StartGame,
		},
		{
			Type:    "select-question",
			Handler: h.SelectQuestion,
		},
		{
			Type:    "question-used",
			Handler: h.MarkQuestionUsed,
		},
		{
			Type:    "update-score",
			Handler: h.UpdateScore,
		},
		{
			Type:    "end-game",
			Handler: h.EndGame,
		},
	}
}
