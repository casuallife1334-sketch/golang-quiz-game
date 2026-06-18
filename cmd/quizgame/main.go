package main

import (
	"context"
	"net/http"
	"os/signal"
	"syscall"

	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/config"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/logger"
	"github.com/casuallife1334-sketch/go-quiz-game/internal/core/realtime"
	http_middleware "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/http/middleware"
	core_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/core/transport/ws"
	answers_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/answers/service"
	answers_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/answers/transport/ws"
	chat_memory_repository "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/repository/memory"
	chat_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/service"
	chat_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/chat/transport/ws"
	game_sessions_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/game_sessions/service"
	game_sessions_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/game_sessions/transport/ws"
	rooms_memory_repository "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/repository/memory"
	rooms_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/service"
	rooms_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/rooms/transport/ws"
	training_service "github.com/casuallife1334-sketch/go-quiz-game/internal/features/training/service"
	training_ws "github.com/casuallife1334-sketch/go-quiz-game/internal/features/training/transport/ws"
	"go.uber.org/zap"
)

func main() {
	cfg := config.New()

	ctx, cancel := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
	defer cancel()

	appLogger, err := logger.NewLogger(logger.NewConfig())
	if err != nil {
		panic(err)
	}
	defer appLogger.Close()

	ctx = logger.ToContext(ctx, appLogger)

	hub := realtime.NewHub()
	router := core_ws.NewRouter()

	roomsRepository := rooms_memory_repository.NewRoomsRepository()
	chatRepository := chat_memory_repository.NewChatRepository()

	chatService := chat_service.NewChatService(roomsRepository, chatRepository)

	roomsService := rooms_service.NewRoomsService(roomsRepository, chatService)
	roomsTransportWS := rooms_ws.NewRoomsWSHandler(roomsService, hub)

	gameSessionsService := game_sessions_service.NewGameSessionsService(roomsRepository)
	gameSessionsTransportWS := game_sessions_ws.NewGameSessionsWSHandler(gameSessionsService, hub)

	answersService := answers_service.NewAnswersService(roomsRepository)
	answersTransportWS := answers_ws.NewAnswersWSHandler(answersService, hub)

	chatTransportWS := chat_ws.NewChatWSHandler(chatService, hub)

	trainingService := training_service.NewTrainingService(roomsRepository)
	trainingTransportWS := training_ws.NewTrainingWSHandler(trainingService, hub)

	router.RegisterRoutes(roomsTransportWS.Routes()...)
	router.RegisterRoutes(gameSessionsTransportWS.Routes()...)
	router.RegisterRoutes(answersTransportWS.Routes()...)
	router.RegisterRoutes(chatTransportWS.Routes()...)
	router.RegisterRoutes(trainingTransportWS.Routes()...)

	wsServer := core_ws.NewServer(
		router,
		hub,
		roomsTransportWS.HandleDisconnect,
		cfg.WSAllowedOrigins,
		logger.NewWSEventObserver(appLogger),
	)

	mux := http.NewServeMux()
	mux.Handle("/ws", wsServer)
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	})

	handler := http_middleware.ChainMiddleware(
		mux,
		http_middleware.RequestID(),
		http_middleware.Logger(appLogger),
		http_middleware.Trace(),
		http_middleware.Panic(),
	)

	server := &http.Server{
		Addr:    cfg.Addr,
		Handler: handler,
	}

	go func() {
		<-ctx.Done()
		_ = server.Shutdown(context.Background())
	}()

	appLogger.Info("quiz game websocket server listening", zap.String("addr", cfg.Addr))
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		appLogger.Fatal("server listen and serve failed", zap.Error(err))
	}
}
