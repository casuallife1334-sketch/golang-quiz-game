package service

import (
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func canPlayerAnswer(room *domain.Room, playerID string) bool {
	if room == nil || room.CurrentQuestion == nil || playerID == "" || playerID == room.HostID {
		return false
	}
	for _, player := range room.Players {
		if player.ID == playerID {
			return true
		}
	}
	return false
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

func canStillAnswer(room *domain.Room) bool {
	if room == nil || room.CurrentQuestion == nil {
		return false
	}
	for _, player := range room.Players {
		if player.ID != room.HostID && !room.CurrentQuestion.AttemptedAnswerers[player.ID] {
			return true
		}
	}
	return false
}

func resumedTimerStart(room *domain.Room) *int64 {
	if room == nil || room.CurrentQuestion == nil || room.CurrentQuestion.StoppedTimeLeft == nil {
		return nil
	}

	value := time.Now().UnixMilli() - int64((room.CurrentQuestion.TimerDuration-*room.CurrentQuestion.StoppedTimeLeft)*1000)
	return &value
}

func questionPoints(room *domain.Room) int {
	if room == nil || room.CurrentQuestion == nil {
		return 0
	}
	if room.CurrentQuestion.Question.Price > 0 {
		return room.CurrentQuestion.Question.Price
	}
	if room.CurrentQuestion.Price > 0 {
		return room.CurrentQuestion.Price
	}
	return 100
}
