SHELL := /bin/sh

# Database configuration
SUPABASE_PROJECT_ID := $(shell grep -s SUPABASE_URL .env | sed 's/.*\/\/\([^.]*\)\.supabase\.co.*/\1/' | head -1)

.PHONY: help install dev-web dev-api dev-admin dev build-web build-api build-admin build lint test clean db db-migrate db-reset db-seed db-generate create-admin

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
	@echo "Database:"
	@echo "  db-migrate          Apply migrations to Supabase (auto)"
	@echo "  db-reset            Drop all tables and data (cascade)"
	@echo "  db-seed             Insert seed data"
	@echo "  db-generate         Generate new migration (NAME=migration_name)"
	@echo "  db-status           Show migration status"
	@echo ""
	@echo "Admin:"
	@echo "  create-admin        Create admin user with hashed password"
	@echo "                      (USERNAME PASSWORD [FULL_NAME] [EMAIL])"
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
ifndef USERNAME
	@echo "Error: USERNAME is required"
	@echo "Usage: make create-admin USERNAME PASSWORD [FULL_NAME] [EMAIL]"
	@echo "Example: make create-admin USERNAME=admin PASSWORD=secret123 FULL_NAME='Admin User' EMAIL='admin@example.com'"
	@exit 1
endif
ifndef PASSWORD
	@echo "Error: PASSWORD is required"
	@echo "Usage: make create-admin USERNAME PASSWORD [FULL_NAME] [EMAIL]"
	@echo "Example: make create-admin USERNAME=admin PASSWORD=secret123 FULL_NAME='Admin User' EMAIL='admin@example.com'"
	@exit 1
endif
	@echo "> Creating admin user: $(USERNAME)..."
	@pnpm run admin:create "$(USERNAME)" "$(PASSWORD)" "$(FULL_NAME)" "$(EMAIL)"
