#!/bin/bash

# Enterprise Template Initialization Script
# This script helps you quickly set up a new project from the template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ASCII Art Banner
print_banner() {
    echo -e "${CYAN}"
    cat << "EOF"
    ╔═══════════════════════════════════════════════════════╗
    ║                                                       ║
    ║     ENTERPRISE AUTHENTICATION TEMPLATE SETUP         ║
    ║                                                       ║
    ║     Fast • Secure • Production-Ready                 ║
    ║                                                       ║
    ╚═══════════════════════════════════════════════════════╝
EOF
    echo -e "${NC}"
}

# Function to print colored messages
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to generate secure random strings
generate_secret() {
    openssl rand -base64 32 2>/dev/null || cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1
}

# Check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    local missing_deps=()
    
    # Check for required tools
    if ! command_exists docker; then
        missing_deps+=("docker")
    fi
    
    if ! command_exists docker-compose; then
        missing_deps+=("docker-compose")
    fi
    
    if ! command_exists node; then
        missing_deps+=("node (v18+)")
    fi
    
    if ! command_exists python3; then
        missing_deps+=("python3 (v3.11+)")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies:"
        for dep in "${missing_deps[@]}"; do
            echo "  - $dep"
        done
        echo ""
        print_warning "Please install the missing dependencies and run this script again."
        exit 1
    fi
    
    print_success "All requirements met!"
}

# Get project configuration from user
get_project_config() {
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}PROJECT CONFIGURATION${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Project Name
    read -p "$(echo -e ${CYAN}Enter your project name${NC} [my-app]: )" PROJECT_NAME
    PROJECT_NAME=${PROJECT_NAME:-my-app}
    
    # Project Type
    echo -e "\n${CYAN}Select project type:${NC}"
    echo "1) SaaS Application"
    echo "2) Internal Enterprise Tool"
    echo "3) API Service"
    echo "4) E-commerce Platform"
    echo "5) Mobile App Backend"
    echo "6) Custom"
    read -p "Choice [1-6]: " PROJECT_TYPE_CHOICE
    
    case $PROJECT_TYPE_CHOICE in
        1) PROJECT_TYPE="saas";;
        2) PROJECT_TYPE="internal";;
        3) PROJECT_TYPE="api";;
        4) PROJECT_TYPE="ecommerce";;
        5) PROJECT_TYPE="mobile";;
        6) PROJECT_TYPE="custom";;
        *) PROJECT_TYPE="saas";;
    esac
    
    # Database
    echo -e "\n${CYAN}Select database:${NC}"
    echo "1) PostgreSQL (Recommended)"
    echo "2) MySQL"
    echo "3) MongoDB"
    echo "4) SQLite (Development only)"
    read -p "Choice [1-4]: " DB_CHOICE
    
    case $DB_CHOICE in
        1) DATABASE="postgresql";;
        2) DATABASE="mysql";;
        3) DATABASE="mongodb";;
        4) DATABASE="sqlite";;
        *) DATABASE="postgresql";;
    esac
    
    # Authentication Methods
    echo -e "\n${CYAN}Select authentication methods (comma-separated):${NC}"
    echo "1) Email/Password"
    echo "2) OAuth (Google, GitHub)"
    echo "3) Magic Links"
    echo "4) Biometric/Passkeys"
    echo "5) All"
    read -p "Choice [1,2,3,4 or 5]: " AUTH_CHOICE
    
    if [[ "$AUTH_CHOICE" == "5" ]]; then
        AUTH_METHODS="email,oauth,magic,biometric"
    else
        AUTH_METHODS="email"  # Default
        [[ "$AUTH_CHOICE" == *"2"* ]] && AUTH_METHODS="${AUTH_METHODS},oauth"
        [[ "$AUTH_CHOICE" == *"3"* ]] && AUTH_METHODS="${AUTH_METHODS},magic"
        [[ "$AUTH_CHOICE" == *"4"* ]] && AUTH_METHODS="${AUTH_METHODS},biometric"
    fi
    
    # Deployment Target
    echo -e "\n${CYAN}Select deployment target:${NC}"
    echo "1) Docker Compose (Local/VPS)"
    echo "2) Kubernetes"
    echo "3) AWS (ECS/Fargate)"
    echo "4) Google Cloud Platform"
    echo "5) Azure"
    echo "6) Vercel/Netlify"
    read -p "Choice [1-6]: " DEPLOY_CHOICE
    
    case $DEPLOY_CHOICE in
        1) DEPLOYMENT="docker";;
        2) DEPLOYMENT="kubernetes";;
        3) DEPLOYMENT="aws";;
        4) DEPLOYMENT="gcp";;
        5) DEPLOYMENT="azure";;
        6) DEPLOYMENT="vercel";;
        *) DEPLOYMENT="docker";;
    esac
    
    # Advanced Features
    echo -e "\n${CYAN}Enable advanced features? (y/n):${NC}"
    read -p "Multi-tenancy [n]: " ENABLE_MULTI_TENANCY
    read -p "Real-time features (WebSockets) [n]: " ENABLE_REALTIME
    read -p "Payment processing [n]: " ENABLE_PAYMENTS
    read -p "Email marketing [n]: " ENABLE_EMAIL_MARKETING
    read -p "Analytics dashboard [n]: " ENABLE_ANALYTICS
    
    # Environment
    echo -e "\n${CYAN}Select initial environment:${NC}"
    echo "1) Development"
    echo "2) Staging"
    echo "3) Production"
    read -p "Choice [1-3]: " ENV_CHOICE
    
    case $ENV_CHOICE in
        1) ENVIRONMENT="development";;
        2) ENVIRONMENT="staging";;
        3) ENVIRONMENT="production";;
        *) ENVIRONMENT="development";;
    esac
}

# Create environment files
create_env_files() {
    print_step "Creating environment configuration files..."
    
    # Generate secrets
    JWT_SECRET=$(generate_secret)
    DB_PASSWORD=$(generate_secret)
    REDIS_PASSWORD=$(generate_secret)
    ADMIN_PASSWORD=$(generate_secret)
    
    # Create .env file
    cat > .env << EOF
# Project Configuration
PROJECT_NAME=${PROJECT_NAME}
PROJECT_TYPE=${PROJECT_TYPE}
ENVIRONMENT=${ENVIRONMENT}

# Security Keys (CHANGE THESE IN PRODUCTION!)
SECRET_KEY=${JWT_SECRET}
JWT_SECRET_KEY=${JWT_SECRET}
ENCRYPTION_KEY=$(generate_secret)

# Database Configuration
DATABASE_TYPE=${DATABASE}
DB_HOST=localhost
DB_PORT=5432
DB_NAME=${PROJECT_NAME//-/_}_db
DB_USER=${PROJECT_NAME//-/_}_user
DB_PASSWORD=${DB_PASSWORD}
DATABASE_URL=${DATABASE}://${PROJECT_NAME//-/_}_user:${DB_PASSWORD}@localhost:5432/${PROJECT_NAME//-/_}_db

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379/0

# JWT Configuration
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Configuration
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8000

# Email Configuration (Optional)
EMAIL_ENABLED=false
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
EMAIL_FROM=${PROJECT_NAME}@example.com
EMAIL_FROM_NAME=${PROJECT_NAME}

# OAuth Configuration (Optional)
OAUTH_ENABLED=$([[ "$AUTH_METHODS" == *"oauth"* ]] && echo "true" || echo "false")
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Feature Flags
ENABLE_MULTI_TENANCY=${ENABLE_MULTI_TENANCY:-n}
ENABLE_REALTIME=${ENABLE_REALTIME:-n}
ENABLE_PAYMENTS=${ENABLE_PAYMENTS:-n}
ENABLE_EMAIL_MARKETING=${ENABLE_EMAIL_MARKETING:-n}
ENABLE_ANALYTICS=${ENABLE_ANALYTICS:-n}

# Admin User
ADMIN_EMAIL=admin@${PROJECT_NAME}.com
ADMIN_PASSWORD=${ADMIN_PASSWORD}

# Monitoring
SENTRY_DSN=
DATADOG_API_KEY=
LOG_LEVEL=INFO

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW=60
EOF
    
    # Create environment-specific files
    cp .env .env.development
    cp .env .env.staging
    
    # Modify production env
    cat > .env.production << EOF
# Production Environment
# SECURITY WARNING: Change all default values!
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=WARNING

# Add production-specific overrides here
EOF
    
    print_success "Environment files created!"
}

# Create docker-compose override for project type
create_docker_override() {
    print_step "Creating Docker Compose override for ${PROJECT_TYPE}..."
    
    case $PROJECT_TYPE in
        "saas")
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  backend:
    environment:
      - ENABLE_MULTI_TENANCY=true
      - ENABLE_BILLING=true
      - ENABLE_ANALYTICS=true
  
  # Stripe webhook handler
  stripe-cli:
    image: stripe/stripe-cli:latest
    profiles:
      - saas
    command: listen --forward-to backend:8000/api/v1/webhooks/stripe
    environment:
      - STRIPE_API_KEY=${STRIPE_SECRET_KEY}
    networks:
      - enterprise_network
EOF
            ;;
            
        "ecommerce")
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  backend:
    environment:
      - ENABLE_INVENTORY=true
      - ENABLE_CART=true
      - ENABLE_PAYMENTS=true
      - ENABLE_SHIPPING=true
  
  # Additional services for e-commerce
  meilisearch:
    image: getmeili/meilisearch:latest
    profiles:
      - ecommerce
    ports:
      - "7700:7700"
    environment:
      - MEILI_MASTER_KEY=${MEILISEARCH_KEY}
    networks:
      - enterprise_network
EOF
            ;;
            
        "api")
            cat > docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  backend:
    environment:
      - API_ONLY_MODE=true
      - ENABLE_API_KEYS=true
      - ENABLE_RATE_LIMITING=true
      - ENABLE_WEBHOOKS=true
  
  # API documentation
  swagger-ui:
    image: swaggerapi/swagger-ui
    profiles:
      - api
    ports:
      - "8080:8080"
    environment:
      - SWAGGER_JSON=/api/openapi.json
      - BASE_URL=/swagger
    networks:
      - enterprise_network
EOF
            ;;
    esac
    
    print_success "Docker override created!"
}

# Setup git repository
setup_git() {
    print_step "Setting up Git repository..."
    
    if [ ! -d .git ]; then
        git init
        git add .
        git commit -m "Initial commit: ${PROJECT_NAME} setup"
        print_success "Git repository initialized!"
    else
        print_warning "Git repository already exists, skipping..."
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing dependencies..."
    
    # Backend dependencies
    if [ -f backend/requirements/base.txt ]; then
        print_step "Installing Python dependencies..."
        cd backend
        python3 -m venv venv
        source venv/bin/activate
        pip install -r requirements/dev.txt
        cd ..
        print_success "Python dependencies installed!"
    fi
    
    # Frontend dependencies
    if [ -f frontend/package.json ]; then
        print_step "Installing Node.js dependencies..."
        cd frontend
        npm install
        cd ..
        print_success "Node.js dependencies installed!"
    fi
}

# Initialize database
init_database() {
    print_step "Initializing database..."
    
    # Start database containers
    docker-compose up -d postgres redis
    
    # Wait for database to be ready
    print_step "Waiting for database to be ready..."
    sleep 5
    
    # Run migrations
    docker-compose exec backend alembic upgrade head
    
    # Seed initial data
    docker-compose exec backend python -m app.core.seed_data
    
    print_success "Database initialized!"
}

# Create initial admin user
create_admin_user() {
    print_step "Creating admin user..."
    
    # This would typically call a management command
    # For now, we'll note it needs to be done
    print_warning "Remember to create an admin user after starting the application"
    echo "  Email: admin@${PROJECT_NAME}.com"
    echo "  Password: ${ADMIN_PASSWORD}"
}

# Generate project documentation
generate_docs() {
    print_step "Generating project documentation..."
    
    cat > PROJECT_INFO.md << EOF
# ${PROJECT_NAME}

## Project Configuration
- **Type**: ${PROJECT_TYPE}
- **Database**: ${DATABASE}
- **Authentication**: ${AUTH_METHODS}
- **Deployment**: ${DEPLOYMENT}
- **Environment**: ${ENVIRONMENT}

## Quick Start

\`\`\`bash
# Start all services
docker-compose up

# Access applications
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
\`\`\`

## Default Credentials
- Admin Email: admin@${PROJECT_NAME}.com
- Admin Password: See .env file

## Next Steps
1. Review and update .env configuration
2. Set up your OAuth providers (if enabled)
3. Configure email service (if needed)
4. Set up monitoring (Sentry, DataDog)
5. Deploy to ${DEPLOYMENT}

## Security Checklist
- [ ] Change all default passwords
- [ ] Update JWT secret keys
- [ ] Configure CORS for production
- [ ] Enable HTTPS
- [ ] Set up firewall rules
- [ ] Configure rate limiting
- [ ] Enable audit logging

Generated on: $(date)
EOF
    
    print_success "Documentation generated!"
}

# Final setup steps
final_steps() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}SETUP COMPLETE!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}Your ${PROJECT_NAME} project is ready!${NC}"
    echo ""
    echo "📁 Project Structure:"
    echo "   ├── backend/     - FastAPI application"
    echo "   ├── frontend/    - Next.js application"
    echo "   ├── .env        - Environment configuration"
    echo "   └── docker-compose.yml - Container orchestration"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "   ${YELLOW}docker-compose up${NC}        - Start all services"
    echo "   ${YELLOW}docker-compose logs -f${NC}   - View logs"
    echo "   ${YELLOW}docker-compose down${NC}      - Stop all services"
    echo ""
    echo "🌐 Access Points:"
    echo "   Frontend:  ${BLUE}http://localhost:3000${NC}"
    echo "   Backend:   ${BLUE}http://localhost:8000${NC}"
    echo "   API Docs:  ${BLUE}http://localhost:8000/docs${NC}"
    echo ""
    echo "📚 Documentation:"
    echo "   - PROJECT_INFO.md    - Your project configuration"
    echo "   - README.md          - General documentation"
    echo "   - IMPROVEMENT_PLAN.md - Roadmap for enhancements"
    echo ""
    echo "⚡ Next Steps:"
    echo "   1. Review .env file and update configuration"
    echo "   2. Start development with: ${YELLOW}docker-compose up${NC}"
    echo "   3. Create your first feature!"
    echo ""
    echo -e "${PURPLE}Happy coding! 🎉${NC}"
}

# Main execution
main() {
    clear
    print_banner
    
    check_requirements
    get_project_config
    
    echo ""
    print_step "Initializing ${PROJECT_NAME}..."
    echo ""
    
    create_env_files
    create_docker_override
    setup_git
    # install_dependencies  # Commented out for faster setup
    # init_database        # Commented out - user will do this
    generate_docs
    
    final_steps
}

# Run the script
main "$@"