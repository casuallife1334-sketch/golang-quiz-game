package memory

import "context"

func (r *ChatRepository) DeleteMessages(ctx context.Context, roomID string) error {
	r.mu.Lock()
	defer r.mu.Unlock()

	delete(r.messages, roomID)
	return nil
}
