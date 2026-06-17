package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type TrainingService interface {
	ChangeSlide(ctx context.Context, roomID string, hostID string, questionKey string, slide int) (*domain.Room, error)
	SubmitAnswer(ctx context.Context, roomID string, playerID string, playerName string, questionKey string, answer string, timeTaken int) (*domain.Room, domain.TrainingAnswer, error)
	VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (*domain.Room, int, error)
	ShowResult(ctx context.Context, roomID string, hostID string, questionKey string, correctAnswer string, playerAnswers []domain.TrainingAnswer) (*domain.Room, error)
}

type TrainingWSHandler struct {
	trainingService TrainingService
	hub             *realtime.Hub
}

func NewTrainingWSHandler(trainingService TrainingService, hub *realtime.Hub) *TrainingWSHandler {
	return &TrainingWSHandler{trainingService: trainingService, hub: hub}
}

func (h *TrainingWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{Type: "training-skip-intro", Handler: h.TrainingSkipIntro},
		{Type: "training-slide-change", Handler: h.TrainingSlideChange},
		{Type: "training-submit-answer", Handler: h.TrainingSubmitAnswer},
		{Type: "training-verify-answer", Handler: h.TrainingVerifyAnswer},
		{Type: "training-show-result", Handler: h.TrainingShowResult},
		{Type: "training-game-end", Handler: h.TrainingGameEnd},
	}
}

func (h *TrainingWSHandler) TrainingSkipIntro(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID      string `json:"roomId"`
		QuestionKey string `json:"questionKey"`
		Slide       int    `json:"slide"`
	}
	_ = json.Unmarshal(payload, &request)
	roomID := fallbackRoomID(request.RoomID, session)
	room, err := h.trainingService.ChangeSlide(ctx, roomID, session.ID(), request.QuestionKey, request.Slide)
	if err != nil {
		return err
	}
	h.hub.BroadcastExcept(room.ID, session.ID(), domain.Event{Type: "training-skip-intro", Payload: map[string]interface{}{"slide": request.Slide}})
	return nil
}

func (h *TrainingWSHandler) TrainingSlideChange(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID      string `json:"roomId"`
		QuestionKey string `json:"questionKey"`
		Slide       int    `json:"slide"`
	}
	_ = json.Unmarshal(payload, &request)
	roomID := fallbackRoomID(request.RoomID, session)
	room, err := h.trainingService.ChangeSlide(ctx, roomID, session.ID(), request.QuestionKey, request.Slide)
	if err != nil {
		return err
	}
	h.hub.BroadcastExcept(room.ID, session.ID(), domain.Event{Type: "training-slide-change", Payload: map[string]interface{}{"slide": request.Slide}})
	return nil
}

func (h *TrainingWSHandler) TrainingSubmitAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID      string `json:"roomId"`
		QuestionKey string `json:"questionKey"`
		Answer      string `json:"answer"`
		TimeTaken   int    `json:"timeTaken"`
		PlayerName  string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, answer, err := h.trainingService.SubmitAnswer(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.PlayerName, request.QuestionKey, request.Answer, request.TimeTaken)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, domain.Event{Type: "training-player-answer", Payload: answer})
	return nil
}

func (h *TrainingWSHandler) TrainingVerifyAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID    string `json:"roomId"`
		PlayerID  string `json:"playerId"`
		IsCorrect bool   `json:"isCorrect"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, points, err := h.trainingService.VerifyAnswer(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.PlayerID, request.IsCorrect)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, domain.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	h.hub.Broadcast(room.ID, domain.Event{Type: "training-answer-verified", Payload: map[string]interface{}{
		"playerId":  request.PlayerID,
		"isCorrect": request.IsCorrect,
		"points":    points,
	}})
	return nil
}

func (h *TrainingWSHandler) TrainingShowResult(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID        string                  `json:"roomId"`
		QuestionKey   string                  `json:"questionKey"`
		CorrectAnswer string                  `json:"correctAnswer"`
		PlayerAnswers []domain.TrainingAnswer `json:"playerAnswers"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.trainingService.ShowResult(ctx, fallbackRoomID(request.RoomID, session), session.ID(), request.QuestionKey, request.CorrectAnswer, request.PlayerAnswers)
	if err != nil {
		return err
	}
	h.hub.Broadcast(room.ID, domain.Event{Type: "training-show-result", Payload: map[string]interface{}{
		"correctAnswer": request.CorrectAnswer,
		"playerAnswers": request.PlayerAnswers,
	}})
	return nil
}

func (h *TrainingWSHandler) TrainingGameEnd(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	_ = json.Unmarshal(payload, &request)
	roomID := fallbackRoomID(request.RoomID, session)
	h.hub.BroadcastExcept(roomID, session.ID(), domain.Event{Type: "training-game-end"})
	return nil
}

func fallbackRoomID(roomID string, session core_ws.Session) string {
	if roomID != "" {
		return roomID
	}
	return session.RoomID()
}
