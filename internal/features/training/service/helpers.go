package service

import (
	"fmt"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func ensureTrainingState(room *domain.Room, questionKey string) {
	if questionKey == "" && room.CurrentQuestion != nil {
		questionKey = fmt.Sprintf("%d-%d", room.CurrentQuestion.CategoryIndex, room.CurrentQuestion.QuestionIndex)
	}
	if room.TrainingState == nil {
		room.TrainingState = &domain.TrainingState{
			QuestionKey:   questionKey,
			Slide:         0,
			PlayerAnswers: []domain.TrainingAnswer{},
		}
	}
}

func isNonHostMember(room *domain.Room, playerID string) bool {
	if room == nil || playerID == "" || playerID == room.HostID {
		return false
	}
	for _, player := range room.Players {
		if player.ID == playerID {
			return true
		}
	}
	return false
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
