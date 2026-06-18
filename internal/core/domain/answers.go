package domain

type PauseTimerResult struct {
	Room             *Room
	AttemptedPlayers []string
}

type VerifyAnswerResult struct {
	Room              *Room
	Points            int
	AttemptedPlayers  []string
	CanStillAnswer    bool
	RevealAnswer      bool
	RevealReason      string
	StoppedTimeLeft   *int
	ResumedTimerStart *int64
}
