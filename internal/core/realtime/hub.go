package realtime

import (
	"sync"
)

type Client interface {
	ID() string
	Send(event Event)
}

type Hub struct {
	mu      sync.RWMutex
	clients map[string]Client
	rooms   map[string]map[string]Client
}

func NewHub() *Hub {
	return &Hub{
		clients: map[string]Client{},
		rooms:   map[string]map[string]Client{},
	}
}

func (h *Hub) AddClient(client Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	h.clients[client.ID()] = client
}

func (h *Hub) RemoveClient(client Client) bool {
	h.mu.Lock()
	defer h.mu.Unlock()

	clientID := client.ID()
	if h.clients[clientID] != client {
		return false
	}

	delete(h.clients, clientID)
	for roomID, clients := range h.rooms {
		if clients[clientID] == client {
			delete(clients, clientID)
		}
		if len(clients) == 0 {
			delete(h.rooms, roomID)
		}
	}
	return true
}

func (h *Hub) JoinRoom(roomID string, client Client) {
	h.mu.Lock()
	defer h.mu.Unlock()

	for currentRoomID, clients := range h.rooms {
		if clients[client.ID()] != nil {
			delete(clients, client.ID())
		}
		if len(clients) == 0 {
			delete(h.rooms, currentRoomID)
		}
	}

	if h.rooms[roomID] == nil {
		h.rooms[roomID] = map[string]Client{}
	}
	h.rooms[roomID][client.ID()] = client
}

func (h *Hub) LeaveRoom(roomID string, clientID string) {
	h.mu.Lock()
	defer h.mu.Unlock()

	if h.rooms[roomID] == nil {
		return
	}
	delete(h.rooms[roomID], clientID)
	if len(h.rooms[roomID]) == 0 {
		delete(h.rooms, roomID)
	}
}

func (h *Hub) Send(clientID string, event Event) {
	h.mu.RLock()
	client := h.clients[clientID]
	h.mu.RUnlock()

	if client != nil {
		client.Send(event)
	}
}

func (h *Hub) Broadcast(roomID string, event Event) {
	h.mu.RLock()
	clients := make([]Client, 0, len(h.rooms[roomID]))
	for _, client := range h.rooms[roomID] {
		clients = append(clients, client)
	}
	h.mu.RUnlock()

	for _, client := range clients {
		client.Send(event)
	}
}

func (h *Hub) BroadcastExcept(roomID string, exceptClientID string, event Event) {
	h.mu.RLock()
	clients := make([]Client, 0, len(h.rooms[roomID]))
	for id, client := range h.rooms[roomID] {
		if id != exceptClientID {
			clients = append(clients, client)
		}
	}
	h.mu.RUnlock()

	for _, client := range clients {
		client.Send(event)
	}
}
