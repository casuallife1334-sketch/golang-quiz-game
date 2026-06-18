package ws

import (
	"testing"
	"time"
)

func TestRateLimiterAllowsUpToEventLimit(t *testing.T) {
	limiter := newRateLimiter()
	now := time.UnixMilli(1000)

	for i := 0; i < eventLimit("chat-message"); i++ {
		if !limiter.Allow("chat-message", now) {
			t.Fatalf("expected chat-message #%d to be allowed", i+1)
		}
	}

	if limiter.Allow("chat-message", now) {
		t.Fatalf("expected chat-message over limit to be rejected")
	}
}

func TestRateLimiterUsesSeparateBucketsByEvent(t *testing.T) {
	limiter := newRateLimiter()
	now := time.UnixMilli(1000)

	for i := 0; i < eventLimit("chat-message"); i++ {
		limiter.Allow("chat-message", now)
	}

	if !limiter.Allow("request-state", now) {
		t.Fatalf("expected different event type to use a separate bucket")
	}
}

func TestRateLimiterResetsAfterWindow(t *testing.T) {
	limiter := newRateLimiter()
	now := time.UnixMilli(1000)

	for i := 0; i < eventLimit("join-room"); i++ {
		limiter.Allow("join-room", now)
	}

	if limiter.Allow("join-room", now) {
		t.Fatalf("expected join-room over limit to be rejected")
	}

	if !limiter.Allow("join-room", now.Add(rateLimitWindow)) {
		t.Fatalf("expected join-room to be allowed after window reset")
	}
}
