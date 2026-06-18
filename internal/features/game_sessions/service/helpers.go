package service

import (
	"fmt"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func questionKey(categoryIndex int, questionIndex int) string {
	return fmt.Sprintf("%d-%d", categoryIndex, questionIndex)
}

func contains(values []string, value string) bool {
	for _, current := range values {
		if current == value {
			return true
		}
	}
	return false
}

func allQuestionsUsed(room *domain.Room) bool {
	if room.Game == nil {
		return false
	}

	total := 0
	for categoryIndex, category := range room.Game.Categories {
		for questionIndex := range category.Questions {
			total++
			if !contains(room.UsedQuestions, questionKey(categoryIndex, questionIndex)) {
				return false
			}
		}
	}
	return total > 0
}
