include .env
export

export PROJECT_ROOT=${shell pwd}

server-run:
	@go run ./cmd/quizgame

frontend-run:
	@cd frontend && npm run dev

test:
	@env GOCACHE=${PROJECT_ROOT}/.gocache go test ./...
	@cd frontend && npm test

build:
	@cd frontend && npm run build

deploy:
	@docker compose up -d --build quizgame-backend quizgame-frontend

undeploy:
	@docker compose down

deploy-logs:
	@docker compose logs -f quizgame-backend quizgame-frontend

deploy-ps:
	@docker compose ps

deploy-restart:
	@docker compose restart quizgame-backend quizgame-frontend
