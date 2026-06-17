package main

import (
	"context"
	"log"
	"net/http"
	"os/signal"
	"syscall"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/config"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
	answers_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/answers/service"
	answers_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/answers/transport/ws"
	chat_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/service"
	chat_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/transport/ws"
	game_sessions_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/game_sessions/service"
	game_sessions_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/game_sessions/transport/ws"
	rooms_memory_repository "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/repository/memory"
	rooms_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/service"
	rooms_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/transport/ws"
	training_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/training/service"
	training_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/training/transport/ws"
)

func main() {
	cfg := config.New()

	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer stop()

	hub := realtime.NewHub()
	router := core_ws.NewRouter()

	roomsRepository := rooms_memory_repository.NewRoomsRepository()

	roomsService := rooms_service.NewRoomsService(roomsRepository)
	roomsTransportWS := rooms_ws.NewRoomsWSHandler(roomsService, hub)

	gameSessionsService := game_sessions_service.NewGameSessionsService(roomsRepository)
	gameSessionsTransportWS := game_sessions_ws.NewGameSessionsWSHandler(gameSessionsService, hub)

	answersService := answers_service.NewAnswersService(roomsRepository)
	answersTransportWS := answers_ws.NewAnswersWSHandler(answersService, hub)

	chatService := chat_service.NewChatService(roomsRepository)
	chatTransportWS := chat_ws.NewChatWSHandler(chatService, hub)

	trainingService := training_service.NewTrainingService(roomsRepository)
	trainingTransportWS := training_ws.NewTrainingWSHandler(trainingService, hub)

	router.RegisterRoutes(roomsTransportWS.Routes()...)
	router.RegisterRoutes(gameSessionsTransportWS.Routes()...)
	router.RegisterRoutes(answersTransportWS.Routes()...)
	router.RegisterRoutes(chatTransportWS.Routes()...)
	router.RegisterRoutes(trainingTransportWS.Routes()...)

	wsServer := core_ws.NewServer(router, hub, roomsTransportWS.HandleDisconnect)

	mux := http.NewServeMux()
	mux.Handle("/ws", wsServer)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	server := &http.Server{
		Addr:    cfg.Addr,
		Handler: mux,
	}

	go func() {
		<-ctx.Done()
		_ = server.Shutdown(context.Background())
	}()

	log.Printf("quiz game websocket server listening on %s", cfg.Addr)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatal(err)
	}
}
