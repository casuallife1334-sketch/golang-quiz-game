package logger

import (
	"context"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	"go.uber.org/zap"
)

type WSEventObserver struct {
	log *Logger
}

func NewWSEventObserver(log *Logger) *WSEventObserver {
	return &WSEventObserver{log: log}
}

func (o *WSEventObserver) ClientConnected(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("websocket client connected")
}

func (o *WSEventObserver) ClientDisconnected(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("websocket client disconnected")
}

func (o *WSEventObserver) IncomingEvent(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("incoming websocket event")
}

func (o *WSEventObserver) EventHandled(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("handled websocket event")
}

func (o *WSEventObserver) EventFailed(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Warn("websocket event handling failed")
}

func (o *WSEventObserver) OutgoingEventQueued(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("queued outgoing websocket event")
}

func (o *WSEventObserver) OutgoingEventDropped(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Warn("dropped outgoing websocket event")
}

func (o *WSEventObserver) OutgoingEventSent(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("sent outgoing websocket event")
}

func (o *WSEventObserver) ReadStopped(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Debug("websocket read stopped")
}

func (o *WSEventObserver) WriteFailed(ctx context.Context, event realtime.EventInfo) {
	o.fromContext(ctx, event).Warn("websocket write failed")
}

func (o *WSEventObserver) fromContext(ctx context.Context, event realtime.EventInfo) *Logger {
	log := FromContext(ctx)
	if log == nil {
		log = o.log
	}

	return log.With(o.fields(event)...)
}

func (o *WSEventObserver) fields(event realtime.EventInfo) []zap.Field {
	fields := []zap.Field{}
	if event.ClientID != "" {
		fields = append(fields, zap.String("client_id", event.ClientID))
	}
	if event.RoomID != "" {
		fields = append(fields, zap.String("room_id", event.RoomID))
	}
	if event.EventType != "" {
		fields = append(fields, zap.String("event_type", event.EventType))
	}
	if event.PayloadSizeBytes > 0 {
		fields = append(fields, zap.Int("payload_size_bytes", event.PayloadSizeBytes))
	}
	if event.Latency > 0 {
		fields = append(fields, zap.Duration("latency", event.Latency))
	}
	if event.Err != nil {
		fields = append(fields, zap.Error(event.Err))
	}

	return fields
}
