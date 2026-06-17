package domain

import "encoding/json"

type GameMode string

const (
	GameModeCustom   GameMode = "custom"
	GameModeTraining GameMode = "training"
)

type Game struct {
	Title        string                 `json:"title"`
	Categories   []Category             `json:"categories"`
	GameMode     GameMode               `json:"gameMode,omitempty"`
	ModeSettings map[string]interface{} `json:"modeSettings,omitempty"`
}

type Category struct {
	Name      string     `json:"name"`
	Questions []Question `json:"questions"`
}

type Question struct {
	Situation     QuestionBlock `json:"situation"`
	Question      string        `json:"question"`
	QuestionImage string        `json:"questionImage"`
	Answer        string        `json:"answer"`
	AnswerImage   string        `json:"answerImage"`
	Explanation   QuestionBlock `json:"explanation"`
	Time          int           `json:"time"`
	Price         int           `json:"price"`
}

type QuestionBlock struct {
	Title       string `json:"title"`
	Description string `json:"description,omitempty"`
	Text        string `json:"text,omitempty"`
	Image       string `json:"image"`
}

type RawGame json.RawMessage
