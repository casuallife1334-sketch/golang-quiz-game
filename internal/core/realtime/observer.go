package realtime

import (
	"context"
	"time"
)

type EventObserver interface {
	ClientConnected(ctx context.Context, event EventInfo)
	ClientDisconnected(ctx context.Context, event EventInfo)
	IncomingEvent(ctx context.Context, event EventInfo)
	EventHandled(ctx context.Context, event EventInfo)
	EventFailed(ctx context.Context, event EventInfo)
	OutgoingEventQueued(ctx context.Context, event EventInfo)
	OutgoingEventDropped(ctx context.Context, event EventInfo)
	OutgoingEventSent(ctx context.Context, event EventInfo)
	ReadStopped(ctx context.Context, event EventInfo)
	WriteFailed(ctx context.Context, event EventInfo)
}

type EventInfo struct {
	ClientID         string
	RoomID           string
	EventType        string
	PayloadSizeBytes int
	Latency          time.Duration
	Err              error
}

type NoopEventObserver struct{}

func (NoopEventObserver) ClientConnected(ctx context.Context, event EventInfo)      {}
func (NoopEventObserver) ClientDisconnected(ctx context.Context, event EventInfo)   {}
func (NoopEventObserver) IncomingEvent(ctx context.Context, event EventInfo)        {}
func (NoopEventObserver) EventHandled(ctx context.Context, event EventInfo)         {}
func (NoopEventObserver) EventFailed(ctx context.Context, event EventInfo)          {}
func (NoopEventObserver) OutgoingEventQueued(ctx context.Context, event EventInfo)  {}
func (NoopEventObserver) OutgoingEventDropped(ctx context.Context, event EventInfo) {}
func (NoopEventObserver) OutgoingEventSent(ctx context.Context, event EventInfo)    {}
func (NoopEventObserver) ReadStopped(ctx context.Context, event EventInfo)          {}
func (NoopEventObserver) WriteFailed(ctx context.Context, event EventInfo)          {}
