package service

import "context"

func (s *ChatService) RoomDeleted(ctx context.Context, roomID string) {
	_ = s.chatRepository.DeleteMessages(ctx, roomID)
}
