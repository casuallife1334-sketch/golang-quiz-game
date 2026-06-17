package domain

type Event struct {
	Type    string      `json:"type"`
	Payload interface{} `json:"payload,omitempty"`
}

type GameStatePayload struct {
	Game          *Game            `json:"game"`
	UsedQuestions []string         `json:"usedQuestions"`
	Scores        map[string]int   `json:"scores"`
	Players       []Player         `json:"players"`
	Host          string           `json:"host"`
	GameMode      GameMode         `json:"gameMode"`
	Question      *CurrentQuestion `json:"currentQuestion,omitempty"`
}

func BuildGameState(room *Room) GameStatePayload {
	return GameStatePayload{
		Game:          room.Game,
		UsedQuestions: room.UsedQuestions,
		Scores:        room.Scores,
		Players:       room.Players,
		Host:          room.HostID,
		GameMode:      room.GameMode,
		Question:      room.CurrentQuestion,
	}
}
