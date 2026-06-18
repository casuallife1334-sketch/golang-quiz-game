FROM golang:1.25.5-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/bin/quizgame ./cmd/quizgame

FROM alpine:3.24.0

RUN apk add --no-cache ca-certificates tzdata \
	&& addgroup -S quizgame \
	&& adduser -S quizgame -G quizgame \
	&& mkdir -p /app/logs \
	&& chown -R quizgame:quizgame /app

WORKDIR /app

COPY --from=builder /app/bin/quizgame /app/quizgame

ENV PROJECT_ROOT=/app
ENV ADDR=:3001
ENV LOGGER_FOLDER=/app/logs

EXPOSE 3001

USER quizgame

CMD ["/app/quizgame"]
