# Enterprise Auth Template - Makefile
# Convenient commands for development and deployment

.PHONY: help install-deps dev-up dev-down dev-restart dev-logs dev-build dev-clean
.PHONY: prod-up prod-down prod-restart prod-logs prod-build prod-clean
.PHONY: test test-backend test-frontend test-e2e
.PHONY: lint lint-backend lint-frontend format format-backend format-frontend
.PHONY: db-migrate db-seed db-reset backup restore
.PHONY: security-scan deps-check deps-update
.DEFAULT_GOAL := help

# Colors for output
RESET = \033[0m
BOLD = \033[1m
GREEN = \033[32m
YELLOW = \033[33m
BLUE = \033[34m

# Configuration
PROJECT_NAME = enterprise-auth-template
DEV_COMPOSE = docker-compose.dev.yml
PROD_COMPOSE = docker-compose.prod.yml

# Help target
help: ## Show this help message
	@echo "$(BOLD)Enterprise Auth Template - Development Commands$(RESET)"
	@echo ""
	@echo "$(BOLD)Development Environment:$(RESET)"
	@awk '/^[a-zA-Z_0-9-]+:.*?##/ { \
		if ($$0 ~ /^dev-/) { \
			printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, substr($$0, index($$0, "##") + 3) \
		} \
	}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BOLD)Production Environment:$(RESET)"
	@awk '/^[a-zA-Z_0-9-]+:.*?##/ { \
		if ($$0 ~ /^prod-/) { \
			printf "  $(YELLOW)%-20s$(RESET) %s\n", $$1, substr($$0, index($$0, "##") + 3) \
		} \
	}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BOLD)Testing & Quality:$(RESET)"
	@awk '/^[a-zA-Z_0-9-]+:.*?##/ { \
		if ($$0 ~ /^(test|lint|format|security|deps)/) { \
			printf "  $(BLUE)%-20s$(RESET) %s\n", $$1, substr($$0, index($$0, "##") + 3) \
		} \
	}' $(MAKEFILE_LIST)
	@echo ""
	@echo "$(BOLD)Database & Utilities:$(RESET)"
	@awk '/^[a-zA-Z_0-9-]+:.*?##/ { \
		if ($$0 ~ /^(db-|backup|restore|install)/) { \
			printf "  $(GREEN)%-20s$(RESET) %s\n", $$1, substr($$0, index($$0, "##") + 3) \
		} \
	}' $(MAKEFILE_LIST)

# Prerequisites check
check-docker:
	@which docker > /dev/null || (echo "Docker is required but not installed" && exit 1)
	@docker info > /dev/null 2>&1 || (echo "Docker is not running" && exit 1)

# Install dependencies
install-deps: ## Install local development dependencies
	@echo "$(GREEN)Installing backend dependencies...$(RESET)"
	cd backend && pip install -r requirements.txt
	@echo "$(GREEN)Installing frontend dependencies...$(RESET)"
	cd frontend && npm install
	@echo "$(GREEN)Dependencies installed successfully!$(RESET)"

# Development Environment Commands
dev-up: check-docker ## Start development environment
	@echo "$(GREEN)Starting development environment...$(RESET)"
	@./scripts/docker-dev.sh start

dev-down: check-docker ## Stop development environment
	@echo "$(YELLOW)Stopping development environment...$(RESET)"
	@./scripts/docker-dev.sh stop

dev-restart: check-docker ## Restart development environment
	@echo "$(YELLOW)Restarting development environment...$(RESET)"
	@./scripts/docker-dev.sh restart

dev-logs: check-docker ## Show development environment logs
	@./scripts/docker-dev.sh logs $(SERVICE)

dev-build: check-docker ## Build development environment
	@echo "$(GREEN)Building development environment...$(RESET)"
	@./scripts/docker-dev.sh build $(SERVICE)

dev-clean: check-docker ## Clean development environment (removes volumes)
	@echo "$(YELLOW)Cleaning development environment...$(RESET)"
	@./scripts/docker-dev.sh cleanup

# Production Environment Commands
prod-up: check-docker ## Start production environment
	@echo "$(GREEN)Starting production environment...$(RESET)"
	docker-compose -f $(PROD_COMPOSE) up -d

prod-down: check-docker ## Stop production environment
	@echo "$(YELLOW)Stopping production environment...$(RESET)"
	docker-compose -f $(PROD_COMPOSE) down

prod-restart: check-docker ## Restart production environment
	@echo "$(YELLOW)Restarting production environment...$(RESET)"
	docker-compose -f $(PROD_COMPOSE) restart

prod-logs: check-docker ## Show production environment logs
	docker-compose -f $(PROD_COMPOSE) logs -f $(SERVICE)

prod-build: check-docker ## Build production environment
	@echo "$(GREEN)Building production environment...$(RESET)"
	docker-compose -f $(PROD_COMPOSE) build --no-cache $(SERVICE)

prod-clean: check-docker ## Clean production environment (removes volumes)
	@echo "$(YELLOW)Cleaning production environment...$(RESET)"
	docker-compose -f $(PROD_COMPOSE) down -v --remove-orphans

# Testing Commands
test: test-backend test-frontend ## Run all tests

test-backend: ## Run backend tests
	@echo "$(BLUE)Running backend tests...$(RESET)"
	cd backend && python -m pytest tests/ -v --cov=app --cov-report=term-missing

test-frontend: ## Run frontend tests
	@echo "$(BLUE)Running frontend tests...$(RESET)"
	cd frontend && npm run test

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(RESET)"
	cd e2e-tests && npm run test

# Linting Commands
lint: lint-backend lint-frontend ## Run linting for both backend and frontend

lint-backend: ## Run backend linting
	@echo "$(BLUE)Linting backend code...$(RESET)"
	cd backend && python -m flake8 app/ tests/
	cd backend && python -m mypy app/

lint-frontend: ## Run frontend linting
	@echo "$(BLUE)Linting frontend code...$(RESET)"
	cd frontend && npm run lint

# Formatting Commands
format: format-backend format-frontend ## Format code for both backend and frontend

format-backend: ## Format backend code
	@echo "$(BLUE)Formatting backend code...$(RESET)"
	cd backend && python -m black app/ tests/
	cd backend && python -m isort app/ tests/

format-frontend: ## Format frontend code
	@echo "$(BLUE)Formatting frontend code...$(RESET)"
	cd frontend && npm run format

# Database Commands
db-migrate: ## Run database migrations
	@echo "$(GREEN)Running database migrations...$(RESET)"
	@./scripts/docker-dev.sh db:migrate

db-seed: ## Seed database with initial data
	@echo "$(GREEN)Seeding database...$(RESET)"
	@./scripts/docker-dev.sh db:seed

db-reset: ## Reset database (WARNING: destroys all data)
	@echo "$(YELLOW)Resetting database...$(RESET)"
	@./scripts/docker-dev.sh db:reset

# Backup and Restore
backup: ## Create database backup
	@echo "$(GREEN)Creating database backup...$(RESET)"
	@mkdir -p backups
	@docker-compose -f $(DEV_COMPOSE) exec postgres pg_dump -U dev_user -d enterprise_auth_dev > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "$(GREEN)Backup created in backups/ directory$(RESET)"

restore: ## Restore database from backup (requires BACKUP_FILE variable)
	@echo "$(YELLOW)Restoring database from backup...$(RESET)"
	@test -n "$(BACKUP_FILE)" || (echo "Please specify BACKUP_FILE variable" && exit 1)
	@docker-compose -f $(DEV_COMPOSE) exec -T postgres psql -U dev_user -d enterprise_auth_dev < $(BACKUP_FILE)
	@echo "$(GREEN)Database restored successfully$(RESET)"

# Security Commands
security-scan: ## Run security scanning
	@echo "$(BLUE)Running security scans...$(RESET)"
	cd backend && python -m safety check
	cd frontend && npm audit
	@echo "$(GREEN)Security scan completed$(RESET)"

# Dependency Management
deps-check: ## Check for outdated dependencies
	@echo "$(BLUE)Checking backend dependencies...$(RESET)"
	cd backend && pip list --outdated
	@echo "$(BLUE)Checking frontend dependencies...$(RESET)"
	cd frontend && npm outdated

deps-update: ## Update dependencies
	@echo "$(YELLOW)Updating backend dependencies...$(RESET)"
	cd backend && pip-upgrade
	@echo "$(YELLOW)Updating frontend dependencies...$(RESET)"
	cd frontend && npm update
	@echo "$(GREEN)Dependencies updated$(RESET)"

# Quick development commands
shell-backend: ## Open shell in backend container
	@./scripts/docker-dev.sh exec backend bash

shell-frontend: ## Open shell in frontend container
	@./scripts/docker-dev.sh exec frontend sh

shell-db: ## Open database shell
	@./scripts/docker-dev.sh exec postgres psql -U dev_user -d enterprise_auth_dev

# Monitoring
monitor: ## Show resource usage
	@echo "$(BLUE)Container resource usage:$(RESET)"
	@docker stats --no-stream

health: ## Check service health
	@echo "$(BLUE)Service health status:$(RESET)"
	@curl -s http://localhost:8000/health || echo "Backend: Unhealthy"
	@curl -s http://localhost:3000 > /dev/null && echo "Frontend: Healthy" || echo "Frontend: Unhealthy"

# Full setup for new developers
setup: ## Complete setup for new developers
	@echo "$(GREEN)Setting up Enterprise Auth Template development environment...$(RESET)"
	@cp .env.example .env.dev
	@echo "$(YELLOW)Please review and update .env.dev configuration$(RESET)"
	@make install-deps
	@make dev-up
	@sleep 10
	@make db-migrate
	@make db-seed
	@echo "$(GREEN)Setup completed! Visit http://localhost:3000$(RESET)"

# CI/CD Commands (used in CI pipelines)
ci-test: ## Run all CI tests
	@echo "$(BLUE)Running CI test suite...$(RESET)"
	@make test
	@make lint
	@make security-scan

ci-build: ## Build for CI/CD
	@echo "$(BLUE)Building for CI/CD...$(RESET)"
	@make dev-build

ci-deploy-staging: ## Deploy to staging
	@echo "$(YELLOW)Deploying to staging...$(RESET)"
	# Add deployment commands here

ci-deploy-production: ## Deploy to production
	@echo "$(YELLOW)Deploying to production...$(RESET)"
	# Add production deployment commands here