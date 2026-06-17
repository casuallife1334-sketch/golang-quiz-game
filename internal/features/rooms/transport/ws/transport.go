package ws

import (
	"context"
	"encoding/json"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

type RoomsService interface {
	CreateRoom(ctx context.Context, clientID string, name string, avatar string) (*domain.Room, error)
	JoinRoom(ctx context.Context, roomID string, clientID string, name string, avatar string) (*domain.Room, error)
	GetRoom(ctx context.Context, roomID string) (*domain.Room, error)
	RemovePlayerFromAllRooms(ctx context.Context, clientID string) ([]*domain.Room, error)
}

type RoomsWSHandler struct {
	roomsService RoomsService
	hub          *realtime.Hub
}

func NewRoomsWSHandler(roomsService RoomsService, hub *realtime.Hub) *RoomsWSHandler {
	return &RoomsWSHandler{roomsService: roomsService, hub: hub}
}

func (h *RoomsWSHandler) Routes() []core_ws.Route {
	return []core_ws.Route{
		{Type: "create-room", Handler: h.CreateRoom},
		{Type: "join-room", Handler: h.JoinRoom},
		{Type: "join-room-event", Handler: h.RequestState},
		{Type: "request-state", Handler: h.RequestState},
	}
}

func (h *RoomsWSHandler) CreateRoom(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.roomsService.CreateRoom(ctx, session.ID(), request.Name, request.Avatar)
	if err != nil {
		return err
	}

	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	session.Send(domain.Event{Type: "room-created", Payload: map[string]string{"roomId": room.ID}})
	h.broadcastRoomState(room)
	return nil
}

func (h *RoomsWSHandler) JoinRoom(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
		Name   string `json:"name"`
		Avatar string `json:"avatar"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return err
	}

	room, err := h.roomsService.JoinRoom(ctx, request.RoomID, session.ID(), request.Name, request.Avatar)
	if err != nil {
		session.Send(domain.Event{Type: "error-room", Payload: map[string]string{"message": "Комната не найдена"}})
		return nil
	}

	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	h.broadcastRoomState(room)
	h.sendReconnectState(session, room)
	return nil
}

func (h *RoomsWSHandler) RequestState(ctx context.Context, session core_ws.Session, payload json.RawMessage) error {
	var request struct {
		RoomID string `json:"roomId"`
	}
	_ = json.Unmarshal(payload, &request)
	if request.RoomID == "" {
		request.RoomID = session.RoomID()
	}
	if request.RoomID == "" {
		return nil
	}

	room, err := h.roomsService.GetRoom(ctx, request.RoomID)
	if err != nil {
		return nil
	}

	session.SetRoomID(room.ID)
	h.hub.JoinRoom(room.ID, session)
	h.sendReconnectState(session, room)
	return nil
}

func (h *RoomsWSHandler) HandleDisconnect(ctx context.Context, clientID string) {
	rooms, err := h.roomsService.RemovePlayerFromAllRooms(ctx, clientID)
	if err != nil {
		return
	}
	for _, room := range rooms {
		h.hub.Broadcast(room.ID, domain.Event{
			Type: "players-update",
			Payload: map[string]interface{}{
				"players": room.Players,
				"host":    room.HostID,
				"roomId":  room.ID,
			},
		})
	}
}

func (h *RoomsWSHandler) broadcastRoomState(room *domain.Room) {
	h.hub.Broadcast(room.ID, domain.Event{
		Type: "players-update",
		Payload: map[string]interface{}{
			"players": room.Players,
			"host":    room.HostID,
			"roomId":  room.ID,
		},
	})
	h.hub.Broadcast(room.ID, domain.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
}

func (h *RoomsWSHandler) sendReconnectState(session core_ws.Session, room *domain.Room) {
	session.Send(domain.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	if room.CurrentQuestion != nil {
		session.Send(domain.Event{Type: "question-selected", Payload: map[string]interface{}{
			"categoryIndex": room.CurrentQuestion.CategoryIndex,
			"questionIndex": room.CurrentQuestion.QuestionIndex,
			"price":         room.CurrentQuestion.Price,
			"question":      room.CurrentQuestion.Question,
			"timerStart":    room.CurrentQuestion.TimerStart,
			"timerDuration": room.CurrentQuestion.TimerDuration,
			"speechStart":   room.CurrentQuestion.SpeechStart,
			"trainingState": room.TrainingState,
		}})
		session.Send(domain.Event{Type: "question-sync-state", Payload: map[string]interface{}{
			"attemptedPlayers": attemptedPlayers(room),
			"activeAnswererId": room.CurrentQuestion.ActiveAnswererID,
			"stoppedTimeLeft":  room.CurrentQuestion.StoppedTimeLeft,
			"timerPausedAt":    room.CurrentQuestion.TimerPausedAt,
		}})
	}
	if room.GameMode == domain.GameModeTraining && room.TrainingState != nil {
		session.Send(domain.Event{Type: "training-sync-state", Payload: room.TrainingState})
	}
	if room.GameEnded {
		session.Send(domain.Event{Type: "game-ended", Payload: map[string]interface{}{
			"scores":   room.Scores,
			"players":  room.Players,
			"gameMode": room.GameMode,
		}})
	}
}

func attemptedPlayers(room *domain.Room) []string {
	if room == nil || room.CurrentQuestion == nil {
		return []string{}
	}
	players := make([]string, 0, len(room.CurrentQuestion.AttemptedAnswerers))
	for playerID := range room.CurrentQuestion.AttemptedAnswerers {
		players = append(players, playerID)
	}
	return players
}
