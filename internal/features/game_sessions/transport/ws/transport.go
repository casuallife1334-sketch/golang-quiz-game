package ws

import (
	"context"
	"encoding/json"

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
	hub                 *realtime.Hub
}

func NewGameSessionsWSHandler(gameSessionsService GameSessionsService, hub *realtime.Hub) *GameSessionsWSHandler {
	return &GameSessionsWSHandler{gameSessionsService: gameSessionsService, hub: hub}
}

func (h *GameSessionsWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{Type: "start-game", Handler: h.StartGame},
		{Type: "select-question", Handler: h.SelectQuestion},
		{Type: "question-used", Handler: h.MarkQuestionUsed},
		{Type: "update-score", Handler: h.UpdateScore},
		{Type: "end-game", Handler: h.EndGame},
	}
}

func (h *GameSessionsWSHandler) StartGame(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID   string          `json:"roomId"`
		Game     domain.Game     `json:"game"`
		GameMode domain.GameMode `json:"gameMode"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.StartGame(ctx, request.RoomID, session.ID(), request.Game, request.GameMode)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "game-started", Payload: map[string]interface{}{"game": room.Game, "gameMode": room.GameMode}})
	h.hub.Broadcast(room.ID, domain.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	return nil
}

func (h *GameSessionsWSHandler) SelectQuestion(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID        string          `json:"roomId"`
		CategoryIndex int             `json:"categoryIndex"`
		QuestionIndex int             `json:"questionIndex"`
		Price         int             `json:"price"`
		Question      domain.Question `json:"question"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.SelectQuestion(ctx, request.RoomID, session.ID(), request.CategoryIndex, request.QuestionIndex, request.Price, request.Question)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "question-selected", Payload: map[string]interface{}{
		"categoryIndex": room.CurrentQuestion.CategoryIndex,
		"questionIndex": room.CurrentQuestion.QuestionIndex,
		"price":         room.CurrentQuestion.Price,
		"question":      room.CurrentQuestion.Question,
		"timerStart":    room.CurrentQuestion.TimerStart,
		"timerDuration": room.CurrentQuestion.TimerDuration,
		"speechStart":   room.CurrentQuestion.SpeechStart,
		"trainingState": room.TrainingState,
	}})
	return nil
}

func (h *GameSessionsWSHandler) MarkQuestionUsed(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID          string `json:"roomId"`
		CategoryIndex   int    `json:"categoryIndex"`
		QuestionIndex   int    `json:"questionIndex"`
		CorrectPlayerID string `json:"correctPlayerId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, allUsed, err := h.gameSessionsService.MarkQuestionUsed(ctx, request.RoomID, session.ID(), request.CategoryIndex, request.QuestionIndex)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "question-marked-used", Payload: map[string]interface{}{
		"categoryIndex":   request.CategoryIndex,
		"questionIndex":   request.QuestionIndex,
		"gameMode":        room.GameMode,
		"game":            room.Game,
		"correctPlayerId": request.CorrectPlayerID,
	}})
	if allUsed {
		h.hub.Broadcast(room.ID, domain.Event{Type: "game-ended", Payload: map[string]interface{}{
			"scores":   room.Scores,
			"players":  room.Players,
			"gameMode": room.GameMode,
		}})
	}
	return nil
}

func (h *GameSessionsWSHandler) UpdateScore(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID   string `json:"roomId"`
		PlayerID string `json:"playerId"`
		Points   int    `json:"points"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.UpdateScore(ctx, request.RoomID, session.ID(), request.PlayerID, request.Points)
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "score-update", Payload: map[string]interface{}{"scores": room.Scores}})
	return nil
}

func (h *GameSessionsWSHandler) EndGame(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.gameSessionsService.EndGame(ctx, request.RoomID, session.ID())
	if err != nil {
		return err
	}

	h.hub.Broadcast(room.ID, domain.Event{Type: "host-end-game", Payload: map[string]interface{}{
		"roomId":   room.ID,
		"endedBy":  session.ID(),
		"scores":   room.Scores,
		"players":  room.Players,
		"gameMode": room.GameMode,
	}})
	return nil
}
