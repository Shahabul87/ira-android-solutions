# 🚀 Enterprise Authentication Template

> **A production-ready authentication template for modern applications**

[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-00C7B7?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-14+-000000?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

## ✨ Features

### 🔐 **Enterprise Authentication**
- **Multiple Auth Methods**: OAuth2, WebAuthn/Passkeys, Email/Password, Magic Links
- **Social Login**: Google, GitHub, Discord integration
- **2FA Support**: TOTP/HOTP authentication
- **Session Management**: JWT with refresh token rotation
- **Account Security**: Rate limiting, account lockout, audit logging

### 🛡️ **Role-Based Access Control (RBAC)**
- **Flexible Permissions**: Resource-action based permissions
- **Role Hierarchy**: Inherited roles and permissions
- **Admin Panel**: User and role management interface
- **Audit Trail**: Complete audit logging for compliance

### 🚀 **Modern Tech Stack**
- **Backend**: FastAPI + SQLAlchemy 2.0 + PostgreSQL
- **Frontend**: Next.js 14 + TypeScript + TailwindCSS + shadcn/ui
- **State Management**: Zustand for client state
- **API Client**: TanStack Query for server state
- **Validation**: Zod + Pydantic for type-safe validation

### 🏗️ **Production Ready**
- **Docker**: Multi-stage builds for development and production
- **Kubernetes**: Production deployment manifests
- **Monitoring**: Structured logging and health checks
- **Security**: Best practices for authentication and authorization
- **Documentation**: Comprehensive setup and API documentation

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local frontend development)
- Python 3.11+ (for local backend development)

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd enterprise-auth-template
cp .env.example .env
```

### 2. Start Development Environment
```bash
# Start all services with Docker
docker-compose up -d

# Or start individually
docker-compose up postgres redis  # Infrastructure
docker-compose up backend         # API server
docker-compose up frontend        # Next.js app
```

### 3. Access Applications
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Admin Panel**: http://localhost:3000/admin

### 4. Default Credentials
- **Super Admin**: admin@example.com / SecurePass123!
- **Regular User**: user@example.com / UserPass123!

## 📁 Project Structure

```
enterprise-auth-template/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Core functionality
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   └── tests/              # Test suite
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── app/           # App Router pages
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities
│   │   └── stores/        # State management
│   └── public/            # Static assets
├── infrastructure/        # Docker & K8s configs
├── docs/                 # Documentation
└── tools/                # Development tools
```

## 📚 Documentation

- **[Quick Start Guide](docs/setup/QUICK_START.md)** - Get up and running in 5 minutes
- **[Development Setup](docs/setup/DEVELOPMENT.md)** - Local development environment
- **[Authentication Flows](docs/authentication/FLOWS.md)** - Auth implementation details
- **[API Documentation](docs/api/ENDPOINTS.md)** - Complete API reference
- **[Deployment Guide](docs/deployment/PRODUCTION.md)** - Production deployment
- **[Security Guide](docs/SECURITY.md)** - Security best practices

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check our [comprehensive docs](docs/)
- **Issues**: Report bugs via GitHub Issues
- **Discussions**: Join our GitHub Discussions for questions

---

**Built with ❤️ for the developer community**