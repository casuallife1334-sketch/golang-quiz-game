package service

import "context"

func (s *RoomsService) notifyRoomDeleted(ctx context.Context, roomID string) {
	for _, observer := range s.observers {
		if observer != nil {
			observer.RoomDeleted(ctx, roomID)
		}
	}
}
