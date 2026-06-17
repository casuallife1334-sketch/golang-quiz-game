package ws

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"sync"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/domain"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	"github.com/gorilla/websocket"
)

type Session interface {
	ID() string
	RoomID() string
	SetRoomID(roomID string)
	Send(event domain.Event)
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
	router   *Router
	hub      *realtime.Hub
	upgrader websocket.Upgrader
	onClose  func(ctx context.Context, clientID string)
}

func NewServer(router *Router, hub *realtime.Hub, onClose func(ctx context.Context, clientID string)) *Server {
	return &Server{
		router:  router,
		hub:     hub,
		onClose: onClose,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool {
				return true
			},
		},
	}
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	conn, err := s.upgrader.Upgrade(w, r, nil)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	session := newClientSession(conn)
	s.hub.AddClient(session)

	go session.writeLoop()
	session.readLoop(r.Context(), s.router, s.onClose, s.hub)
}

type envelope struct {
	Type    string          `json:"type"`
	Payload json.RawMessage `json:"payload"`
}

type clientSession struct {
	id     string
	conn   *websocket.Conn
	send   chan domain.Event
	mu     sync.RWMutex
	roomID string
}

func newClientSession(conn *websocket.Conn) *clientSession {
	return &clientSession{
		id:   randomSessionID(),
		conn: conn,
		send: make(chan domain.Event, 64),
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

func (c *clientSession) Send(event domain.Event) {
	select {
	case c.send <- event:
	default:
	}
}

func (c *clientSession) readLoop(ctx context.Context, router *Router, onClose func(context.Context, string), hub *realtime.Hub) {
	defer func() {
		if onClose != nil {
			onClose(ctx, c.ID())
		}
		hub.RemoveClient(c.ID())
		close(c.send)
		_ = c.conn.Close()
	}()

	for {
		var message envelope
		if err := c.conn.ReadJSON(&message); err != nil {
			return
		}
		if err := router.Handle(ctx, c, message); err != nil {
			c.Send(domain.Event{Type: "error", Payload: map[string]string{"message": err.Error()}})
		}
	}
}

func (c *clientSession) writeLoop() {
	for event := range c.send {
		if err := c.conn.WriteJSON(event); err != nil {
			log.Printf("websocket write error: %v", err)
			return
		}
	}
}
