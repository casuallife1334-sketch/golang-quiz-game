package ws

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type AnswersService interface {
	PlayerWantsAnswer(ctx context.Context, roomID string, playerID string) (*domain.Room, error)
	PauseTimer(ctx context.Context, roomID string, playerID string, timeLeft int) (domain.PauseTimerResult, error)
	SubmitAnswer(ctx context.Context, roomID string, playerID string, answer string) (*domain.Room, error)
	AnswerTimeout(ctx context.Context, roomID string, playerID string) (domain.VerifyAnswerResult, error)
	VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (domain.VerifyAnswerResult, error)
}

type AnswersWSHandler struct {
	answersService AnswersService
	hub            realtime.RoomHub
}

func NewAnswersWSHandler(answersService AnswersService, hub realtime.RoomHub) *AnswersWSHandler {
	return &AnswersWSHandler{answersService: answersService, hub: hub}
}

func (h *AnswersWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{
			Type:    "player-wants-answer",
			Handler: h.PlayerWantsAnswer,
		},
		{
			Type:    "pause-timer",
			Handler: h.PauseTimer,
		},
		{
			Type:    "submit-player-answer",
			Handler: h.SubmitAnswer,
		},
		{
			Type:    "player-answer-timeout",
			Handler: h.AnswerTimeout,
		},
		{
			Type:    "verify-player-answer",
			Handler: h.VerifyAnswer,
		},
	}
}
