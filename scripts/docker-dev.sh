#!/bin/bash

# Enterprise Auth Template - Development Docker Management Script
# Provides convenient commands for managing the development environment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="enterprise-auth-template"
COMPOSE_FILE="docker-compose.dev.yml"
ENV_FILE=".env.dev"

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed and running
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi

    if ! docker info &> /dev/null; then
        log_error "Docker is not running. Please start Docker first."
        exit 1
    fi
}

# Check if Docker Compose is available
check_docker_compose() {
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose is not available. Please install Docker Compose first."
        exit 1
    fi
}

# Get the compose command (docker-compose or docker compose)
get_compose_cmd() {
    if command -v docker-compose &> /dev/null; then
        echo "docker-compose"
    else
        echo "docker compose"
    fi
}

# Create .env.dev file if it doesn't exist
create_env_file() {
    if [[ ! -f "$ENV_FILE" ]]; then
        log_info "Creating $ENV_FILE file..."
        cp .env.example "$ENV_FILE"
        log_success "$ENV_FILE created. Please review and update the configuration."
    fi
}

# Start the development environment
start() {
    log_info "Starting development environment..."
    
    create_env_file
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE --env-file $ENV_FILE up -d
    
    log_success "Development environment started!"
    log_info "Services available at:"
    echo "  - Frontend: http://localhost:3000"
    echo "  - Backend API: http://localhost:8000"
    echo "  - API Docs: http://localhost:8000/docs"
    echo "  - pgAdmin: http://localhost:5050"
    echo "  - Database: localhost:5432"
    echo "  - Redis: localhost:6379"
}

# Stop the development environment
stop() {
    log_info "Stopping development environment..."
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE down
    
    log_success "Development environment stopped!"
}

# Restart the development environment
restart() {
    log_info "Restarting development environment..."
    stop
    start
}

# Show service status
status() {
    log_info "Service status:"
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE ps
}

# Show service logs
logs() {
    local service=${1:-""}
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    if [[ -n "$service" ]]; then
        log_info "Showing logs for service: $service"
        $COMPOSE_CMD -f $COMPOSE_FILE logs -f "$service"
    else
        log_info "Showing logs for all services:"
        $COMPOSE_CMD -f $COMPOSE_FILE logs -f
    fi
}

# Build services
build() {
    local service=${1:-""}
    
    log_info "Building services..."
    
    COMPOSE_CMD=$(get_compose_cmd)
    
    if [[ -n "$service" ]]; then
        log_info "Building service: $service"
        $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache "$service"
    else
        $COMPOSE_CMD -f $COMPOSE_FILE build --no-cache
    fi
    
    log_success "Build completed!"
}

# Clean up (remove containers, networks, volumes)
cleanup() {
    log_warning "This will remove all containers, networks, and volumes for this project."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Cleaning up..."
        
        COMPOSE_CMD=$(get_compose_cmd)
        $COMPOSE_CMD -f $COMPOSE_FILE down -v --remove-orphans
        
        # Remove dangling images
        docker image prune -f
        
        log_success "Cleanup completed!"
    else
        log_info "Cleanup cancelled."
    fi
}

# Execute command in a service container
exec_cmd() {
    local service=$1
    shift
    local cmd="$@"
    
    if [[ -z "$service" ]]; then
        log_error "Please specify a service name."
        exit 1
    fi
    
    COMPOSE_CMD=$(get_compose_cmd)
    $COMPOSE_CMD -f $COMPOSE_FILE exec "$service" $cmd
}

# Database operations
db_migrate() {
    log_info "Running database migrations..."
    exec_cmd backend python -m alembic upgrade head
    log_success "Database migrations completed!"
}

db_seed() {
    log_info "Seeding database with initial data..."
    exec_cmd backend python -m app.scripts.seed_data
    log_success "Database seeding completed!"
}

db_reset() {
    log_warning "This will reset the database and all data will be lost."
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "Resetting database..."
        
        # Stop the backend to avoid connection issues
        COMPOSE_CMD=$(get_compose_cmd)
        $COMPOSE_CMD -f $COMPOSE_FILE stop backend
        
        # Reset database
        exec_cmd postgres psql -U dev_user -d enterprise_auth_dev -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
        
        # Restart backend
        $COMPOSE_CMD -f $COMPOSE_FILE start backend
        
        # Run migrations
        sleep 5  # Wait for backend to start
        db_migrate
        
        log_success "Database reset completed!"
    else
        log_info "Database reset cancelled."
    fi
}

# Show help
show_help() {
    echo "Enterprise Auth Template - Development Environment Manager"
    echo
    echo "Usage: $0 <command> [options]"
    echo
    echo "Commands:"
    echo "  start                 Start the development environment"
    echo "  stop                  Stop the development environment"
    echo "  restart               Restart the development environment"
    echo "  status                Show service status"
    echo "  logs [service]        Show logs (all services or specific service)"
    echo "  build [service]       Build services (all or specific service)"
    echo "  cleanup               Remove containers, networks, and volumes"
    echo "  exec <service> <cmd>  Execute command in service container"
    echo "  db:migrate            Run database migrations"
    echo "  db:seed               Seed database with initial data"
    echo "  db:reset              Reset database (WARNING: destroys all data)"
    echo "  help                  Show this help message"
    echo
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 exec backend bash"
    echo "  $0 build frontend"
    echo
}

# Main script logic
main() {
    check_docker
    check_docker_compose
    
    case "${1:-}" in
        start)
            start
            ;;
        stop)
            stop
            ;;
        restart)
            restart
            ;;
        status)
            status
            ;;
        logs)
            logs "${2:-}"
            ;;
        build)
            build "${2:-}"
            ;;
        cleanup)
            cleanup
            ;;
        exec)
            if [[ $# -lt 3 ]]; then
                log_error "Usage: $0 exec <service> <command>"
                exit 1
            fi
            exec_cmd "${@:2}"
            ;;
        db:migrate)
            db_migrate
            ;;
        db:seed)
            db_seed
            ;;
        db:reset)
            db_reset
            ;;
        help|--help|-h)
            show_help
            ;;
        "")
            log_error "No command specified."
            show_help
            exit 1
            ;;
        *)
            log_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@"