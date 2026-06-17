# Go Quiz Game

Realtime quiz backend rewritten from the JavaScript `quiz-game` server.

The project follows the same architectural direction as `golang-todoapp`:

- `internal/core` contains shared infrastructure and domain types.
- `internal/features/<feature>` contains vertical feature modules.
- Each feature keeps transport, service, and repository boundaries separate.
- WebSocket handlers decode events and call services; services do not depend on WebSocket.

## WebSocket API

Connect to:

```text
ws://localhost:3001/ws
```

Message shape:

```json
{
  "type": "create-room",
  "payload": {
    "name": "Host",
    "avatar": ""
  }
}
```

The server responds with the same envelope shape:

```json
{
  "type": "room-created",
  "payload": {
    "roomId": "ABCD"
  }
}
```

## Run

```bash
go run ./cmd/quizgame
```
# golang-quiz-game
