# Makefile with Windows compatibility
# Note: For Windows, some commands may require WSL or Git Bash

.PHONY: help install dev-web dev-api dev-admin dev dev-uat build-web build-api build-admin build build-uat build-prod lint test test-uat test-prod verify-apps clean db db-migrate db-reset db-seed db-generate create-admin

## Help
help:
	@echo "Usage: make <target>"
	@echo ""
	@echo "Development:"
	@echo "  dev-web             Run web-client in dev mode (port 3001)"
	@echo "  dev-api             Run service-api in dev mode (port 3000)"
	@echo "  dev-admin           Run web-admin in dev mode (port 3002)"
	@echo "  dev                 Run all services in parallel (local .env)"
	@echo "  dev-uat             Run all services with APP_ENV=uat"
	@echo ""
	@echo "Build:"
	@echo "  build-web           Build web-client"
	@echo "  build-api           Build service-api"
	@echo "  build-admin         Build web-admin"
	@echo "  build               Build all projects"
	@echo "  build-uat           Build api/web-admin/web-client with UAT env"
	@echo "  build-prod          Build api/web-admin/web-client with PROD env"
	@echo ""
	@echo "Test & Verify:"
	@echo "  test-uat            Lint + typecheck API with APP_ENV=uat"
	@echo "  test-prod           Lint + typecheck API with APP_ENV=prod"
	@echo "  verify-apps         Run full app verification pipeline"
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

dev-uat:
	set APP_ENV=uat&& pnpm run dev

## Build
build-web:
	pnpm run build:web

build-api:
	pnpm run build:api

build-admin:
	pnpm run build:admin

build:
	pnpm run build

build-uat:
	set APP_ENV=uat&& pnpm --filter @medical-portal/shared build
	set APP_ENV=uat&& set NODE_ENV=production&& pnpm --filter service-api build
	pnpm --filter web-admin run build:uat
	set APP_ENV=uat&& set NODE_ENV=production&& pnpm --filter web-client build

build-prod:
	set APP_ENV=prod&& pnpm --filter @medical-portal/shared build
	set APP_ENV=prod&& set NODE_ENV=production&& pnpm --filter service-api build
	pnpm --filter web-admin run build:prod
	set APP_ENV=prod&& set NODE_ENV=production&& pnpm --filter web-client build

## Other
lint:
	pnpm run lint

test:
	pnpm run test

test-uat:
	set APP_ENV=uat&& pnpm --filter service-api typecheck
	set APP_ENV=uat&& pnpm --filter service-api lint

test-prod:
	set APP_ENV=prod&& pnpm --filter service-api typecheck
	set APP_ENV=prod&& pnpm --filter service-api lint

verify-apps:
	pnpm run verify:apps

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
