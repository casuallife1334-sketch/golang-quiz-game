package memory

import "github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"

func cloneRoom(room *domain.Room) *domain.Room {
	if room == nil {
		return nil
	}

	clone := *room
	clone.Players = append([]domain.Player(nil), room.Players...)
	clone.UsedQuestions = append([]string(nil), room.UsedQuestions...)
	clone.Scores = map[string]int{}
	for playerID, score := range room.Scores {
		clone.Scores[playerID] = score
	}
	if room.CurrentQuestion != nil {
		current := *room.CurrentQuestion
		current.AttemptedAnswerers = map[string]bool{}
		for playerID, attempted := range room.CurrentQuestion.AttemptedAnswerers {
			current.AttemptedAnswerers[playerID] = attempted
		}
		if room.CurrentQuestion.PendingAnswer != nil {
			pending := *room.CurrentQuestion.PendingAnswer
			current.PendingAnswer = &pending
		}
		clone.CurrentQuestion = &current
	}
	if room.TrainingState != nil {
		training := *room.TrainingState
		training.PlayerAnswers = append([]domain.TrainingAnswer(nil), room.TrainingState.PlayerAnswers...)
		clone.TrainingState = &training
	}
	if room.Meta != nil {
		clone.Meta = map[string]interface{}{}
		for key, value := range room.Meta {
			clone.Meta[key] = value
		}
	}
	return &clone
}
