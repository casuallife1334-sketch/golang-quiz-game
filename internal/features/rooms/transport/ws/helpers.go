package ws

import (
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
)

func (h *RoomsWSHandler) broadcastRoomState(room *domain.Room) {
	h.hub.Broadcast(room.ID, realtime.Event{
		Type: "players-update",
		Payload: map[string]interface{}{
			"players": room.Players,
			"host":    room.HostID,
			"roomId":  room.ID,
		},
	})
	h.hub.Broadcast(room.ID, realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
}

func (h *RoomsWSHandler) sendReconnectState(session core_ws.Session, room *domain.Room) {
	session.Send(realtime.Event{Type: "game-state", Payload: domain.BuildGameState(room)})
	if room.CurrentQuestion != nil {
		session.Send(realtime.Event{Type: "question-selected", Payload: map[string]interface{}{
			"categoryIndex": room.CurrentQuestion.CategoryIndex,
			"questionIndex": room.CurrentQuestion.QuestionIndex,
			"price":         room.CurrentQuestion.Price,
			"question":      room.CurrentQuestion.Question,
			"timerStart":    room.CurrentQuestion.TimerStart,
			"timerDuration": room.CurrentQuestion.TimerDuration,
			"speechStart":   room.CurrentQuestion.SpeechStart,
			"trainingState": room.TrainingState,
		}})
		session.Send(realtime.Event{Type: "question-sync-state", Payload: map[string]interface{}{
			"categoryIndex":    room.CurrentQuestion.CategoryIndex,
			"questionIndex":    room.CurrentQuestion.QuestionIndex,
			"attemptedPlayers": attemptedPlayers(room),
			"activeAnswererId": room.CurrentQuestion.ActiveAnswererID,
			"pendingAnswer":    room.CurrentQuestion.PendingAnswer,
			"stoppedTimeLeft":  room.CurrentQuestion.StoppedTimeLeft,
			"timerPausedAt":    room.CurrentQuestion.TimerPausedAt,
		}})
	}
	if room.GameMode == domain.GameModeTraining && room.TrainingState != nil {
		session.Send(realtime.Event{Type: "training-sync-state", Payload: room.TrainingState})
	}
	if room.GameEnded {
		session.Send(realtime.Event{Type: "game-ended", Payload: map[string]interface{}{
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
