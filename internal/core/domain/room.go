package domain

import "time"

type Player struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Avatar string `json:"avatar"`
}

type Room struct {
	ID              string                 `json:"roomId"`
	Players         []Player               `json:"players"`
	HostID          string                 `json:"host"`
	Game            *Game                  `json:"game"`
	GameRaw         RawGame                `json:"-"`
	GameMode        GameMode               `json:"gameMode"`
	UsedQuestions   []string               `json:"usedQuestions"`
	CurrentQuestion *CurrentQuestion       `json:"currentQuestion"`
	Scores          map[string]int         `json:"scores"`
	TrainingState   *TrainingState         `json:"trainingState,omitempty"`
	GameEnded       bool                   `json:"gameEnded"`
	Meta            map[string]interface{} `json:"meta,omitempty"`
}

type CurrentQuestion struct {
	CategoryIndex      int             `json:"categoryIndex"`
	QuestionIndex      int             `json:"questionIndex"`
	Price              int             `json:"price"`
	Question           Question        `json:"question"`
	TimerStart         int64           `json:"timerStart"`
	TimerDuration      int             `json:"timerDuration"`
	SpeechStart        int64           `json:"speechStart"`
	ActiveAnswererID   string          `json:"activeAnswererId,omitempty"`
	AttemptedAnswerers map[string]bool `json:"attemptedAnswerers"`
	StoppedTimeLeft    *int            `json:"stoppedTimeLeft,omitempty"`
	TimerPausedAt      *int64          `json:"timerPausedAt,omitempty"`
}

type TrainingState struct {
	QuestionKey   string           `json:"questionKey"`
	Slide         int              `json:"slide"`
	PlayerAnswers []TrainingAnswer `json:"playerAnswers"`
	CorrectAnswer string           `json:"correctAnswer,omitempty"`
}

type TrainingAnswer struct {
	PlayerID   string `json:"playerId"`
	PlayerName string `json:"playerName"`
	Answer     string `json:"answer"`
	TimeTaken  int    `json:"timeTaken"`
	IsCorrect  *bool  `json:"isCorrect"`
}

func NewRoom(id string, host Player) *Room {
	return &Room{
		ID:            id,
		Players:       []Player{host},
		HostID:        host.ID,
		GameMode:      GameModeCustom,
		UsedQuestions: []string{},
		Scores:        map[string]int{},
	}
}

func NewCurrentQuestion(categoryIndex int, questionIndex int, price int, question Question) *CurrentQuestion {
	now := time.Now().UnixMilli()
	duration := question.Time
	if duration <= 0 {
		duration = 30
	}

	return &CurrentQuestion{
		CategoryIndex:      categoryIndex,
		QuestionIndex:      questionIndex,
		Price:              price,
		Question:           question,
		TimerStart:         now,
		TimerDuration:      duration,
		SpeechStart:        now + 350,
		AttemptedAnswerers: map[string]bool{},
	}
}
