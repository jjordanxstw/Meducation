SHELL := /bin/sh

.PHONY: help install service-api dev-service start-service typecheck-service dev-admin dev-client dev-all lint build

## Help
help:
	@echo "Usage: make <target>"
	@echo "Targets:"
	@echo "  install             Install workspace dependencies (pnpm install)"
	@echo "  service-api         Run service-api in dev mode"
	@echo "  dev-service         Alias for service-api"
	@echo "  start-service       Run service-api start (production)"
	@echo "  typecheck-service   Run TypeScript typecheck for service-api"
	@echo "  dev-admin           Run web-admin in dev mode"
	@echo "  dev-client          Run web-client in dev mode"
	@echo "  dev-all             Start all three services (runs three terminals sequentially)"

## Install dependencies for the whole monorepo
install:
	pnpm install

dev-service: service-api

## service-api production start
start-service:
	pnpm --filter service-api run start

## service-api typecheck
typecheck-service:
	pnpm --filter service-api run typecheck

## service-api dev
service-api:
	pnpm --filter service-api run dev

## web-admin dev
dev-admin:
	pnpm --filter web-admin run dev

## web-client dev
dev-client:
	pnpm --filter web-client run dev

## Start all three (note: runs sequentially in same terminal). Use separate terminals for concurrency.
dev-all:
	@echo "Starting service-api..."
	pnpm --filter service-api run dev
	@echo "Starting web-admin... (open a new terminal if you want them concurrently)"
	pnpm --filter web-admin run dev
	@echo "Starting web-client... (open a new terminal if you want them concurrently)"
	pnpm --filter web-client run dev

## Lint (example for service-api)
lint:
	pnpm --filter service-api run lint

## Build all projects
build:
	pnpm -w run build
