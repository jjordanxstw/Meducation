SHELL := /bin/sh

.PHONY: help install dev-web dev-api dev-admin dev build-web build-api build-admin build lint test clean db-migrate db-seed

## Help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  dev:web             Run web-client in dev mode"
	@echo "  dev:api             Run service-api in dev mode"
	@echo "  dev:admin           Run web-admin in dev mode"
	@echo "  dev                 Run all services in parallel"
	@echo ""
	@echo "Build:"
	@echo "  build:web           Build web-client"
	@echo "  build:api           Build service-api"
	@echo "  build:admin         Build web-admin"
	@echo "  build               Build all projects"
	@echo ""
	@echo "Other:"
	@echo "  install             Install workspace dependencies"
	@echo "  lint                Lint all projects"
	@echo "  test                Test all projects"
	@echo "  clean               Clean all build artifacts and node_modules"
	@echo "  db:migrate          Run database migrations"
	@echo "  db:seed             Seed the database"

## Install dependencies
install:
	pnpm install

## Development
dev-web:
	pnpm run dev:web

dev-api:
	pnpm run dev:api

dev-admin:
	pnpm run dev:admin

dev:
	pnpm run dev

## Build
build-web:
	pnpm run build:web

build-api:
	pnpm run build:api

build-admin:
	pnpm run build:admin

build:
	pnpm run build

## Other
lint:
	pnpm run lint

test:
	pnpm run test

clean:
	pnpm run clean

db-migrate:
	pnpm run db:migrate

db-seed:
	pnpm run db:seed
