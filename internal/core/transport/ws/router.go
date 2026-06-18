package ws

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"sync"
	"time"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	"github.com/gorilla/websocket"
)

type Session interface {
	ID() string
	RoomID() string
	SetRoomID(roomID string)
	Send(event realtime.Event)
}

type HandlerFunc func(ctx context.Context, session Session, payload json.RawMessage) error

type Route struct {
	Type    string
	Handler HandlerFunc
}

type Router struct {
	handlers map[string]HandlerFunc
}

func NewRouter() *Router {
	return &Router{handlers: map[string]HandlerFunc{}}
}

func (r *Router) RegisterRoutes(routes ...Route) {
	for _, route := range routes {
		r.handlers[route.Type] = route.Handler
	}
}

func (r *Router) Handle(ctx context.Context, session Session, envelope envelope) error {
	handler := r.handlers[envelope.Type]
	if handler == nil {
		return errors.New("unknown event type")
	}
	return handler(ctx, session, envelope.Payload)
}

type Server struct {
	router         *Router
	hub            realtime.ClientHub
	upgrader       websocket.Upgrader
	onClose        func(ctx context.Context, clientID string)
	observer       realtime.EventObserver
	allowedOrigins map[string]struct{}
	allowAnyOrigin bool
	clientIDSecret []byte
}

func NewServer(
	router *Router,
	hub realtime.ClientHub,
	onClose func(ctx context.Context, clientID string),
	allowedOrigins []string,
	observers ...realtime.EventObserver,
) *Server {
	observer := realtime.EventObserver(realtime.NoopEventObserver{})
	if len(observers) > 0 && observers[0] != nil {
		observer = observers[0]
	}

	server := &Server{
		router:         router,
		hub:            hub,
		onClose:        onClose,
		observer:       observer,
		allowedOrigins: map[string]struct{}{},
		upgrader:       websocket.Upgrader{},
		clientIDSecret: randomSecret(),
	}

	for _, origin := range allowedOrigins {
		if origin == "*" {
			server.allowAnyOrigin = true
			continue
		}
		server.allowedOrigins[origin] = struct{}{}
	}
	server.upgrader.CheckOrigin = server.checkOrigin

	return server
}

func (s *Server) checkOrigin(r *http.Request) bool {
	origin := r.Header.Get("Origin")
	if origin == "" {
		return true
	}
	if s.allowAnyOrigin {
		return true
	}
	_, ok := s.allowedOrigins[origin]
	return ok
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	session := newClientSession(
		r.Context(),
		conn,
		s.observer,
		signedSessionID(
			r.URL.Query().Get("clientId"),
			r.URL.Query().Get("clientToken"),
			s.clientIDSecret,
		),
	)
	s.hub.AddClient(session)

	s.observer.ClientConnected(r.Context(), realtime.EventInfo{ClientID: session.ID()})

	go session.writeLoop()
	session.Send(realtime.Event{Type: "connect", Payload: map[string]string{
		"id":    session.ID(),
		"token": sessionToken(session.ID(), s.clientIDSecret),
	}})
	session.readLoop(r.Context(), s.router, s.onClose, s.hub)
}

type envelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type clientSession struct {
	id       string
	ctx      context.Context
	conn     *websocket.Conn
	send     chan realtime.Event
	observer realtime.EventObserver
	limiter  *rateLimiter
	mu       sync.RWMutex
	roomID   string
}

func newClientSession(ctx context.Context, conn *websocket.Conn, observer realtime.EventObserver, id string) *clientSession {
	return &clientSession{
		id:       id,
		ctx:      ctx,
		conn:     conn,
		send:     make(chan realtime.Event, 64),
		observer: observer,
		limiter:  newRateLimiter(),
	}
}

func (c *clientSession) ID() string {
	return c.id
}

func (c *clientSession) RoomID() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.roomID
}

func (c *clientSession) SetRoomID(roomID string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.roomID = roomID
}

func (c *clientSession) Send(event realtime.Event) {
	select {
	case c.send <- event:
		c.observer.OutgoingEventQueued(c.ctx, realtime.EventInfo{
			ClientID:         c.ID(),
			RoomID:           c.RoomID(),
			EventType:        event.Type,
			PayloadSizeBytes: payloadSize(event.Payload),
		})
	default:
		c.observer.OutgoingEventDropped(c.ctx, realtime.EventInfo{
			ClientID:         c.ID(),
			RoomID:           c.RoomID(),
			EventType:        event.Type,
			PayloadSizeBytes: payloadSize(event.Payload),
		})
	}
}

func (c *clientSession) readLoop(ctx context.Context, router *Router, onClose func(context.Context, string), hub realtime.ClientHub) {
	defer func() {
		c.observer.ClientDisconnected(ctx, realtime.EventInfo{ClientID: c.ID(), RoomID: c.RoomID()})
		removedActiveClient := hub.RemoveClient(c)
		if removedActiveClient && onClose != nil {
			onClose(ctx, c.ID())
		}
		close(c.send)
		_ = c.conn.Close()
	}()

	for {
		var message envelope
		if err := c.conn.ReadJSON(&message); err != nil {
			c.observer.ReadStopped(ctx, realtime.EventInfo{
				ClientID: c.ID(),
				RoomID:   c.RoomID(),
				Err:      err,
			})
			return
		}

		startedAt := time.Now()
		roomID := payloadRoomID(message.Payload)
		if roomID == "" {
			roomID = c.RoomID()
		}

		c.observer.IncomingEvent(ctx, realtime.EventInfo{
			ClientID:         c.ID(),
			RoomID:           roomID,
			EventType:        message.Type,
			PayloadSizeBytes: len(message.Payload),
		})

		if !c.limiter.Allow(message.Type, startedAt) {
			err := errors.New("rate limit exceeded")
			c.observer.EventFailed(ctx, realtime.EventInfo{
				ClientID:  c.ID(),
				RoomID:    roomID,
				EventType: message.Type,
				Latency:   time.Since(startedAt),
				Err:       err,
			})
			c.Send(realtime.Event{Type: "rate-limit", Payload: map[string]string{
				"eventType": message.Type,
				"message":   err.Error(),
			}})
			continue
		}

		if err := router.Handle(ctx, c, message); err != nil {
			c.observer.EventFailed(ctx, realtime.EventInfo{
				ClientID:  c.ID(),
				RoomID:    roomID,
				EventType: message.Type,
				Latency:   time.Since(startedAt),
				Err:       err,
			})
			c.Send(realtime.Event{Type: "error", Payload: map[string]string{"message": err.Error()}})
			continue
		}

		c.observer.EventHandled(ctx, realtime.EventInfo{
			ClientID:  c.ID(),
			RoomID:    roomID,
			EventType: message.Type,
			Latency:   time.Since(startedAt),
		})
	}
}

func (c *clientSession) writeLoop() {
	for event := range c.send {
		if err := c.conn.WriteJSON(event); err != nil {
			c.observer.WriteFailed(c.ctx, realtime.EventInfo{
				ClientID:  c.ID(),
				RoomID:    c.RoomID(),
				EventType: event.Type,
				Err:       err,
			})
			return
		}
		c.observer.OutgoingEventSent(c.ctx, realtime.EventInfo{
			ClientID:         c.ID(),
			RoomID:           c.RoomID(),
			EventType:        event.Type,
			PayloadSizeBytes: payloadSize(event.Payload),
		})
	}
}

func payloadRoomID(payload json.RawMessage) string {
	var request struct {
		RoomID string `json:"roomId"`
	}
	if err := json.Unmarshal(payload, &request); err != nil {
		return ""
	}
	return request.RoomID
}

func payloadSize(payload interface{}) int {
	if payload == nil {
		return 0
	}

	data, err := json.Marshal(payload)
	if err != nil {
		return 0
	}
	return len(data)
}
