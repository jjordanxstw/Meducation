# Makefile with Windows compatibility
# Note: For Windows, some commands may require WSL or Git Bash

.PHONY: help install dev-web dev-api dev-admin dev build-web build-api build-admin build lint test clean db db-migrate db-reset db-seed db-generate create-admin

## Help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  dev:web             Run web-client in dev mode (port 3001)"
	@echo "  dev:api             Run service-api in dev mode (port 3000)"
	@echo "  dev:admin           Run web-admin in dev mode (port 3002)"
	@echo "  dev                 Run all services in parallel"
	@echo ""
	@echo "Build:"
	@echo "  build:web           Build web-client"
	@echo "  build:api           Build service-api"
	@echo "  build:admin         Build web-admin"
	@echo "  build               Build all projects"
	@echo ""
	@echo "Database:"
	@echo "  db-migrate          Apply migrations to Supabase (auto)"
	@echo "  db-reset            Drop all tables and data (cascade)"
	@echo "  db-seed             Insert seed data"
	@echo "  db-generate         Generate new migration (NAME=migration_name)"
	@echo "  db-status           Show migration status"
	@echo ""
	@echo "Admin:"
	@echo "  create-admin        Create admin user (interactive)"
	@echo ""
	@echo "Other:"
	@echo "  install             Install workspace dependencies"
	@echo "  lint                Lint all projects"
	@echo "  test                Test all projects"
	@echo "  clean               Clean all build artifacts and node_modules"

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

## Database - Migrations
db-migrate:
	@echo "> Applying migrations to Supabase..."
	pnpm run db:migrate

db-reset:
	@echo "> Resetting database (cascade delete all data)..."
	pnpm run db:reset

db-seed:
	@echo "> Seeding database..."
	pnpm run db:seed

db-generate:
ifndef NAME
	@echo "Error: NAME is required"
	@echo "Usage: make db-generate NAME=migration_name"
	@echo "Example: make db-generate NAME=add_users_table"
	@exit 1
endif
	@echo "> Generating new migration: $(NAME)..."
	pnpm run db:generate "$(NAME)"

db-status:
	@echo "> Migration status:"
	pnpm run db:status

## Admin
create-admin:
	pnpm run admin:create
