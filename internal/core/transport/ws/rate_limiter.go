package ws

import "time"

const rateLimitWindow = 10 * time.Second

type rateLimitBucket struct {
	start time.Time
	count int
}

type rateLimiter struct {
	buckets map[string]rateLimitBucket
}

func newRateLimiter() *rateLimiter {
	return &rateLimiter{buckets: map[string]rateLimitBucket{}}
}

func (l *rateLimiter) Allow(eventType string, now time.Time) bool {
	limit := eventLimit(eventType)
	bucket := l.buckets[eventType]

	if bucket.start.IsZero() || now.Sub(bucket.start) >= rateLimitWindow {
		l.buckets[eventType] = rateLimitBucket{start: now, count: 1}
		return true
	}

	if bucket.count >= limit {
		return false
	}

	bucket.count++
	l.buckets[eventType] = bucket
	return true
}

func eventLimit(eventType string) int {
	switch eventType {
	case "chat-message":
		return 10
	case "create-room", "join-room", "join-room-event", "request-state", "request-chat-history":
		return 5
	case "pause-timer", "player-wants-answer", "submit-answer", "answer-timeout":
		return 12
	default:
		return 30
	}
}
