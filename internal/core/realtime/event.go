package realtime

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

type RoomHub interface {
	JoinRoom(roomID string, client Client)
	Broadcast(roomID string, event Event)
	BroadcastExcept(roomID string, exceptClientID string, event Event)
}

type ClientHub interface {
	AddClient(client Client)
	RemoveClient(client Client) bool
}
