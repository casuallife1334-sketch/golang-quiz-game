package ws

import (
	"context"
	"encoding/json"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
	answers_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/answers/service"
)

type AnswersService interface {
	PlayerWantsAnswer(ctx context.Context, roomID string, playerID string) (*domain.Room, error)
	PauseTimer(ctx context.Context, roomID string, playerID string, timeLeft int) (answers_service.PauseTimerResult, error)
	SubmitAnswer(ctx context.Context, roomID string, playerID string, answer string) (*domain.Room, error)
	AnswerTimeout(ctx context.Context, roomID string, playerID string) (answers_service.VerifyAnswerResult, error)
	VerifyAnswer(ctx context.Context, roomID string, hostID string, playerID string, isCorrect bool) (answers_service.VerifyAnswerResult, error)
}

type AnswersWSHandler struct {
	answersService AnswersService
	hub            *realtime.Hub
}

func NewAnswersWSHandler(answersService AnswersService, hub *realtime.Hub) *AnswersWSHandler {
	return &AnswersWSHandler{answersService: answersService, hub: hub}
}

func (h *AnswersWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{Type: "player-wants-answer", Handler: h.PlayerWantsAnswer},
		{Type: "pause-timer", Handler: h.PauseTimer},
		{Type: "submit-player-answer", Handler: h.SubmitAnswer},
		{Type: "player-answer-timeout", Handler: h.AnswerTimeout},
		{Type: "verify-player-answer", Handler: h.VerifyAnswer},
	}
}

func (h *AnswersWSHandler) PlayerWantsAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.answersService.PlayerWantsAnswer(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "player-answer-request", Payload: map[string]interface{}{
		"playerId":   session.ID(),
		"playerName": request.PlayerName,
		"timestamp":  time.Now().UnixMilli(),
	}})
	return nil
}

func (h *AnswersWSHandler) PauseTimer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
		TimeLeft   int    `json:"timeLeft"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.PauseTimer(ctx, request.RoomID, session.ID(), request.TimeLeft)
	if err != nil {
		session.Send(domain.Event{Type: "player-answer-rejected", Payload: map[string]interface{}{"playerId": session.ID(), "reason": err.Error()}})
		return nil
	}

	payloadOut := map[string]interface{}{
		"playerId":         session.ID(),
		"playerName":       request.PlayerName,
		"timestamp":        time.Now().UnixMilli(),
		"timeLeft":         request.TimeLeft,
		"attemptedPlayers": result.AttemptedPlayers,
	}
	h.hub.Broadcast(result.Room.ID, domain.Event{Type: "pause-timer", Payload: payloadOut})
	h.hub.Broadcast(result.Room.ID, domain.Event{Type: "player-answer-request", Payload: map[string]interface{}{
		"playerId":   session.ID(),
		"playerName": request.PlayerName,
		"timestamp":  time.Now().UnixMilli(),
	}})
	return nil
}

func (h *AnswersWSHandler) SubmitAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
		Answer     string `json:"answer"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.answersService.SubmitAnswer(ctx, request.RoomID, session.ID(), request.Answer)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "player-answer-submitted", Payload: map[string]interface{}{
		"playerId":   session.ID(),
		"playerName": request.PlayerName,
		"answer":     request.Answer,
		"timestamp":  time.Now().UnixMilli(),
	}})
	return nil
}

func (h *AnswersWSHandler) AnswerTimeout(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerName string `json:"playerName"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.AnswerTimeout(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	h.hub.Broadcast(result.Room.ID, domain.Event{Type: "player-answer-result", Payload: map[string]interface{}{
		"playerId":          session.ID(),
		"playerName":        request.PlayerName,
		"isCorrect":         false,
		"correctAnswer":     result.Room.CurrentQuestion.Question.Answer,
		"points":            0,
		"stoppedTimeLeft":   result.StoppedTimeLeft,
		"resumedTimerStart": result.ResumedTimerStart,
		"attemptedPlayers":  result.AttemptedPlayers,
	}})
	if result.RevealAnswer {
		h.hub.Broadcast(result.Room.ID, domain.Event{Type: "reveal-answer", Payload: map[string]interface{}{
			"reason":           result.RevealReason,
			"attemptedPlayers": result.AttemptedPlayers,
			"activeAnswererId": result.Room.CurrentQuestion.ActiveAnswererID,
			"stoppedTimeLeft":  result.StoppedTimeLeft,
			"timerPausedAt":    result.Room.CurrentQuestion.TimerPausedAt,
		}})
	}
	return nil
}

func (h *AnswersWSHandler) VerifyAnswer(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID     string `json:"roomId"`
		PlayerID   string `json:"playerId"`
		PlayerName string `json:"playerName"`
		IsCorrect  bool   `json:"isCorrect"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	result, err := h.answersService.VerifyAnswer(ctx, request.RoomID, session.ID(), request.PlayerID, request.IsCorrect)
	if err != nil {
		return err
	}

	h.hub.Broadcast(result.Room.ID, domain.Event{Type: "score-update", Payload: map[string]interface{}{"scores": result.Room.Scores}})
	h.hub.Broadcast(result.Room.ID, domain.Event{Type: "player-answer-result", Payload: map[string]interface{}{
		"playerId":          request.PlayerID,
		"playerName":        request.PlayerName,
		"isCorrect":         request.IsCorrect,
		"correctAnswer":     result.Room.CurrentQuestion.Question.Answer,
		"points":            result.Points,
		"stoppedTimeLeft":   result.StoppedTimeLeft,
		"resumedTimerStart": result.ResumedTimerStart,
		"attemptedPlayers":  result.AttemptedPlayers,
	}})
	if result.RevealAnswer {
		h.hub.Broadcast(result.Room.ID, domain.Event{Type: "reveal-answer", Payload: map[string]interface{}{
			"reason":           result.RevealReason,
			"attemptedPlayers": result.AttemptedPlayers,
			"stoppedTimeLeft":  result.StoppedTimeLeft,
			"timerPausedAt":    nil,
		}})
	}
	return nil
}
