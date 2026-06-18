# Go Quiz Game

Realtime quiz-игра, переписанная с JavaScript/Socket.IO на Go/WebSocket.

## Архитектура

- `internal/core` — общие части приложения: конфиг, доменные типы, realtime hub, WebSocket transport.
- `internal/features/<feature>` — отдельные функциональные модули.
- `frontend` — React/Vite фронтенд, подключенный к Go backend через обычный WebSocket.
- Внутри фич сохраняется разделение по слоям:
  - `transport/ws` — обработчики WebSocket-событий;
  - `service` — бизнес-логика;
  - `repository` — хранение данных, если оно нужно фиче.
- WebSocket handlers только принимают события, разбирают payload и вызывают сервисы.
- Сервисы не зависят от WebSocket и работают через интерфейсы.

## Фичи

- `rooms` — создание комнаты, вход игроков, reconnect state, отключение игроков, передача роли ведущего.
- `game_sessions` — старт игры, выбор вопроса, отметка вопроса использованным, завершение игры, ручное обновление счета.
- `answers` — запрос на ответ, пауза таймера, отправка ответа, timeout, проверка ответа ведущим, начисление и списание очков.
- `chat` — сообщения внутри комнаты.
- `training` — события режима обучения: переключение слайдов, ответы игроков, проверка ответов, показ результата.

## WebSocket API

Подключение:

```text
ws://localhost:3001/ws
```

Формат входящих и исходящих сообщений:

```json
{
  "type": "create-room",
  "payload": {
    "name": "Host",
    "avatar": ""
  }
}
```

Пример ответа сервера:

```json
{
  "type": "room-created",
  "payload": {
    "roomId": "ABCD"
  }
}
```

## Запуск

Backend:

```bash
go run ./cmd/quizgame
```

По умолчанию сервер слушает порт `3001`.

Логи пишутся в stdout и в директорию `logs/`.

WebSocket проверяет `Origin`. Для локальной разработки разрешены:

- `http://localhost:5173`
- `http://127.0.0.1:5173`
- `http://localhost:3001`
- `http://127.0.0.1:3001`

Для деплоя укажите публичные origin через запятую:

```bash
WS_ALLOWED_ORIGINS=https://quiz.example.com,https://www.quiz.example.com go run ./cmd/quizgame
```

Настройки logger:

```bash
LOGGER_LEVEL=DEBUG LOGGER_FOLDER=logs go run ./cmd/quizgame
```

Health check:

```text
http://localhost:3001/health
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

По умолчанию Vite откроется на `http://localhost:5173` и будет подключаться к backend по `ws://localhost:3001/ws`.

## Проверка

```bash
go test ./...
cd frontend && npm run build
```
