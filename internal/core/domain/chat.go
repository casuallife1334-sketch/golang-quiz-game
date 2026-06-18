package domain

type ChatMessage struct {
	ID          string `json:"id"`
	RoomID      string `json:"roomId"`
	PlayerID    string `json:"playerId"`
	UserID      string `json:"userId"`
	Name        string `json:"name"`
	Username    string `json:"username"`
	Avatar      string `json:"avatar"`
	AvatarColor string `json:"avatarColor"`
	Text        string `json:"text"`
	Time        string `json:"time"`
	Timestamp   int64  `json:"timestamp"`
}
