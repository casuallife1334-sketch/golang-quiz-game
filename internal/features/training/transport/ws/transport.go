package ws

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type TrainingService interface {
	ChangeSlide(ctx context.Context, roomID string, hostID string, questionKey string, slide int) (*domain.Room, error)
	SubmitAnswer(ctx context.Context, roomID string, playerID string, playerName string, questionKey string, answer string, timeTaken int) (*domain.Room, domain.TrainingAnswer, error)
	VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (*domain.Room, int, error)
	ShowResult(ctx context.Context, roomID string, hostID string, questionKey string, correctAnswer string, playerAnswers []domain.TrainingAnswer) (*domain.Room, error)
	EndGame(ctx context.Context, roomID string, hostID string) (*domain.Room, error)
}

type TrainingWSHandler struct {
	trainingService TrainingService
	hub             realtime.RoomHub
}

func NewTrainingWSHandler(trainingService TrainingService, hub realtime.RoomHub) *TrainingWSHandler {
	return &TrainingWSHandler{trainingService: trainingService, hub: hub}
}

func (h *TrainingWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{
			Type:    "training-skip-intro",
			Handler: h.TrainingSkipIntro,
		},
		{
			Type:    "training-slide-change",
			Handler: h.TrainingSlideChange,
		},
		{
			Type:    "training-submit-answer",
			Handler: h.TrainingSubmitAnswer,
		},
		{
			Type:    "training-verify-answer",
			Handler: h.TrainingVerifyAnswer,
		},
		{
			Type:    "training-show-result",
			Handler: h.TrainingShowResult,
		},
		{
			Type:    "training-game-end",
			Handler: h.TrainingGameEnd,
		},
	}
}
