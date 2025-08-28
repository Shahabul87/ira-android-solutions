# Docker Setup Guide

This guide explains how to set up and run the Enterprise Auth Template using Docker for both development and production environments.

## Prerequisites

- Docker 24.0+ installed
- Docker Compose 2.0+ installed
- At least 4GB RAM available for Docker
- At least 10GB free disk space

## Quick Start (Development)

1. **Clone and navigate to the project:**
   ```bash
   cd enterprise-auth-template
   ```

2. **Set up environment:**
   ```bash
   # Copy environment template
   cp .env.example .env.dev
   
   # Edit the configuration as needed
   vim .env.dev
   ```

3. **Start development environment:**
   ```bash
   # Using the convenience script
   ./scripts/docker-dev.sh start
   
   # Or using Make
   make dev-up
   
   # Or using Docker Compose directly
   docker-compose -f docker-compose.dev.yml up -d
   ```

4. **Access the application:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs
   - pgAdmin: http://localhost:5050
   - Database: localhost:5432

## Environment Configurations

### Development Environment

**File:** `docker-compose.dev.yml`

**Features:**
- Hot reload for both frontend and backend
- Development database with sample data
- pgAdmin for database management
- Optimized for fast development cycles
- All logs accessible via Docker logs

**Services:**
- `postgres` - PostgreSQL 15 (port 5432)
- `redis` - Redis 7 (port 6379)  
- `backend` - FastAPI with hot reload (port 8000)
- `frontend` - Next.js with hot reload (port 3000)
- `pgadmin` - Database management UI (port 5050)

### Production Environment

**File:** `docker-compose.prod.yml`

**Features:**
- Multi-replica setup for high availability
- SSL/TLS encryption
- Comprehensive monitoring and logging
- Resource limits and health checks
- Security hardening

**Services:**
- `postgres` - PostgreSQL with SSL
- `redis` - Redis with authentication
- `backend` - FastAPI with Gunicorn (multiple replicas)
- `frontend` - Next.js optimized build (multiple replicas)
- `nginx` - Reverse proxy with SSL
- `prometheus` - Metrics collection
- `grafana` - Monitoring dashboards
- `elasticsearch` - Log aggregation
- `kibana` - Log visualization

### Full Stack (All Services)

**File:** `docker-compose.yml`

**Features:**
- Complete observability stack
- Development and production profiles
- Comprehensive monitoring
- Log aggregation and analysis

## Management Scripts

### Docker Development Script

The `./scripts/docker-dev.sh` script provides convenient commands:

```bash
# Start services
./scripts/docker-dev.sh start

# Stop services
./scripts/docker-dev.sh stop

# Restart services
./scripts/docker-dev.sh restart

# View logs
./scripts/docker-dev.sh logs [service]

# Build services
./scripts/docker-dev.sh build [service]

# Execute commands in containers
./scripts/docker-dev.sh exec backend bash
./scripts/docker-dev.sh exec postgres psql -U dev_user -d enterprise_auth_dev

# Database operations
./scripts/docker-dev.sh db:migrate
./scripts/docker-dev.sh db:seed
./scripts/docker-dev.sh db:reset

# Cleanup (removes all data)
./scripts/docker-dev.sh cleanup
```

### Makefile Commands

Use `make` commands for common development tasks:

```bash
# Development environment
make dev-up          # Start development environment
make dev-down        # Stop development environment
make dev-restart     # Restart development environment
make dev-logs        # Show logs
make dev-build       # Build services

# Production environment
make prod-up         # Start production environment
make prod-down       # Stop production environment
make prod-logs       # Show production logs

# Testing and quality
make test            # Run all tests
make lint            # Run linting
make format          # Format code
make security-scan   # Security scanning

# Database operations
make db-migrate      # Run migrations
make db-seed         # Seed database
make db-reset        # Reset database

# Utilities
make backup          # Create database backup
make shell-backend   # Open backend shell
make shell-db        # Open database shell
make health          # Check service health
```

## Service Details

### Backend (FastAPI)

**Development Container:**
- Base: `python:3.11-slim`
- Hot reload with uvicorn
- Development dependencies included
- Volume mounted for code changes

**Production Container:**
- Optimized multi-stage build
- Gunicorn with multiple workers
- Health checks enabled
- Security hardening applied

**Key Features:**
- Automatic database migrations on startup
- Comprehensive logging
- Metrics endpoint for monitoring
- OpenAPI documentation

### Frontend (Next.js)

**Development Container:**
- Base: `node:18-alpine`
- Hot reload enabled
- Development server
- Volume mounted for code changes

**Production Container:**
- Optimized build with standalone output
- Static asset optimization
- Security headers configured
- Performance optimized

**Key Features:**
- Server-side rendering
- Static asset optimization
- Progressive web app features
- TypeScript compilation

### Database (PostgreSQL)

**Configuration:**
- PostgreSQL 15 Alpine
- Custom initialization scripts
- Performance tuned settings
- Backup and restore support

**Extensions Enabled:**
- `uuid-ossp` - UUID generation
- `pgcrypto` - Cryptographic functions
- `citext` - Case-insensitive text

### Cache (Redis)

**Configuration:**
- Redis 7 Alpine
- Persistence enabled
- Memory optimization
- Connection pooling

**Usage:**
- Session storage
- API response caching
- Rate limiting
- Task queue backend

## Environment Variables

### Required Variables

```bash
# Database
POSTGRES_DB=enterprise_auth_dev
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_password

# Application
SECRET_KEY=your-secret-key-here
FRONTEND_URL=http://localhost:3000
```

### Optional Variables

```bash
# Email (for production)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# OAuth (for production)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Monitoring
GRAFANA_PASSWORD=admin123
```

## Networking

### Development Network
- Network: `dev_network`
- Driver: `bridge`
- All services can communicate by service name

### Production Network
- Network: `prod_network` 
- Driver: `bridge`
- Subnet: `172.21.0.0/16`
- Security groups applied

## Data Persistence

### Development Volumes
- `postgres_dev_data` - Database data
- `redis_dev_data` - Redis data
- `pgadmin_dev_data` - pgAdmin settings
- `backend_dev_logs` - Application logs

### Production Volumes
- `postgres_prod_data` - Database data
- `redis_prod_data` - Redis data
- `elasticsearch_prod_data` - Search data
- `prometheus_prod_data` - Metrics data
- `grafana_prod_data` - Dashboard data

## Health Checks

All services include comprehensive health checks:

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 10s
  retries: 3
  start_period: 40s
```

## Monitoring and Observability

### Development Monitoring
- Service status via Docker commands
- Log aggregation via Docker logs
- pgAdmin for database monitoring

### Production Monitoring
- Prometheus for metrics collection
- Grafana for visualization
- Elasticsearch + Kibana for logs
- Nginx access logs
- Application performance metrics

## Security

### Development Security
- Basic authentication
- Local network isolation
- Development certificates

### Production Security
- SSL/TLS encryption
- Security headers
- Rate limiting
- Input validation
- Database encryption
- Secret management
- Network policies

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :8000
   lsof -i :5432
   ```

2. **Permission issues:**
   ```bash
   # Fix Docker permissions (Linux)
   sudo chown -R $USER:$USER .
   ```

3. **Out of disk space:**
   ```bash
   # Clean Docker system
   docker system prune -a
   make dev-clean
   ```

4. **Database connection issues:**
   ```bash
   # Check database logs
   make dev-logs postgres
   
   # Reset database
   make db-reset
   ```

5. **Frontend build issues:**
   ```bash
   # Rebuild frontend
   make dev-build frontend
   
   # Clear node_modules
   docker-compose -f docker-compose.dev.yml exec frontend rm -rf node_modules
   make dev-restart
   ```

### Debug Mode

Enable debug logging:

```bash
# Set debug environment
export DEBUG=true

# View detailed logs
make dev-logs
```

### Performance Issues

Monitor resource usage:

```bash
# Check container stats
docker stats

# Check system resources
make monitor
```

## Backup and Restore

### Create Backup
```bash
# Automated backup
make backup

# Manual backup
docker-compose -f docker-compose.dev.yml exec postgres \
  pg_dump -U dev_user enterprise_auth_dev > backup.sql
```

### Restore from Backup
```bash
# Using Make
make restore BACKUP_FILE=backup.sql

# Manual restore
docker-compose -f docker-compose.dev.yml exec -T postgres \
  psql -U dev_user -d enterprise_auth_dev < backup.sql
```

## Development Workflow

1. **Daily Development:**
   ```bash
   make dev-up        # Start services
   make dev-logs      # Monitor logs
   # ... develop ...
   make dev-down      # Stop when done
   ```

2. **Database Changes:**
   ```bash
   # After model changes
   make shell-backend
   python -m alembic revision --autogenerate -m "description"
   make db-migrate
   ```

3. **Testing:**
   ```bash
   make test          # Run tests
   make lint          # Check code quality
   make format        # Format code
   ```

4. **Before Commit:**
   ```bash
   make ci-test       # Full CI test suite
   ```

## Production Deployment

1. **Prepare Environment:**
   ```bash
   cp .env.example .env.prod
   # Edit .env.prod with production values
   ```

2. **Deploy:**
   ```bash
   make prod-build
   make prod-up
   ```

3. **Monitor:**
   ```bash
   make health        # Check service health
   make prod-logs     # Monitor logs
   ```

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Review container logs: `make dev-logs [service]`
3. Check service health: `make health`
4. Verify environment configuration
5. Create an issue in the project repository

## Performance Tuning

### Development Performance
- Allocate at least 4GB RAM to Docker
- Use SSD storage for better I/O
- Enable Docker BuildKit for faster builds

### Production Performance
- Scale services based on load
- Optimize database queries
- Enable caching strategies
- Monitor resource usage
- Use CDN for static assets