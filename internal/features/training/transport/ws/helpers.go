package ws

import core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"

func fallbackRoomID(roomID string, session core_ws.Session) string {
	if roomID != "" {
		return roomID
	}
	return session.RoomID()
}
