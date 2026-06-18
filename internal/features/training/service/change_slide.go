package service

import (
	"context"
	"errors"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
)

func (s *TrainingService) ChangeSlide(ctx context.Context, roomID string, hostID string, questionKey string, slide int) (*domain.Room, error) {
	return s.roomsRepository.UpdateRoomByID(ctx, roomID, func(room *domain.Room) error {
		if room.HostID != hostID {
			return errors.New("only host can change training slide")
		}

		ensureTrainingState(room, questionKey)
		room.TrainingState.Slide = slide
		return nil
	})
}
