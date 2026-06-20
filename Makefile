include .env
export

export PROJECT_ROOT=${shell pwd}
BUILD_ID := $(shell date +%Y%m%d%H%M%S)
export BUILD_ID

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
	@docker compose down --remove-orphans --volumes --rmi all
	@docker compose build --no-cache --pull quizgame-backend quizgame-frontend
	@docker compose up -d --force-recreate --remove-orphans quizgame-backend quizgame-frontend

deploy-fresh:
	@docker compose down --remove-orphans --volumes --rmi all
	@docker compose build --no-cache --pull quizgame-backend quizgame-frontend
	@docker compose up -d --force-recreate --remove-orphans quizgame-backend quizgame-frontend

undeploy:
	@docker compose down

deploy-logs:
	@docker compose logs -f quizgame-backend quizgame-frontend

deploy-ps:
	@docker compose ps

deploy-restart:
	@docker compose restart quizgame-backend quizgame-frontend
