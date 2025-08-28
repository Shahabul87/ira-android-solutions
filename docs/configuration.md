# Configuration Guide

This guide covers all configuration options for the Enterprise Authentication Template.

## Environment Variables

### Backend Configuration

Create a `.env` file in the `/backend` directory with the following variables:

#### Database Configuration

```env
# PostgreSQL Database URL
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Database Pool Settings
DB_POOL_SIZE=20
DB_MAX_OVERFLOW=40
DB_POOL_TIMEOUT=30
DB_POOL_RECYCLE=1800

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_MAX_CONNECTIONS=50
```

#### Security Configuration

```env
# Secret Keys (MUST change in production)
SECRET_KEY=your-secret-key-minimum-32-characters
JWT_SECRET_KEY=your-jwt-secret-minimum-32-characters

# JWT Settings
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Password Policy
PASSWORD_MIN_LENGTH=8
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true

# Account Security
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=30
PASSWORD_RESET_TOKEN_EXPIRE_HOURS=24
EMAIL_VERIFICATION_TOKEN_EXPIRE_DAYS=7
```

#### OAuth Provider Configuration

```env
# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/callback

# Microsoft OAuth
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/callback
```

#### Email Configuration

```env
# SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
SMTP_TLS=true
SMTP_SSL=false

# Email Settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Enterprise Auth
```

#### Application Settings

```env
# API Settings
API_V1_PREFIX=/api/v1
PROJECT_NAME=Enterprise Auth API
VERSION=1.0.0
DEBUG=false
ALLOWED_HOSTS=["localhost", "127.0.0.1"]

# CORS Settings
CORS_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]
CORS_ALLOW_CREDENTIALS=true
CORS_ALLOW_METHODS=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
CORS_ALLOW_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000
```

#### Monitoring & Logging

```env
# Logging
LOG_LEVEL=INFO
LOG_FORMAT=json
LOG_FILE=/var/log/app/backend.log

# Sentry (Optional)
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1

# Metrics (Optional)
ENABLE_METRICS=true
METRICS_PORT=9090
```

### Frontend Configuration

Create a `.env.local` file in the `/frontend` directory:

```env
# Application
NEXT_PUBLIC_APP_NAME=Enterprise Auth
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_DESCRIPTION=Enterprise Authentication Template

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_API_TIMEOUT=30000

# Features
NEXT_PUBLIC_ENABLE_OAUTH=true
NEXT_PUBLIC_ENABLE_2FA=true
NEXT_PUBLIC_ENABLE_MAGIC_LINKS=false

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=your-posthog-key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# Sentry (Optional)
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project
```

## Docker Configuration

### Development Environment

The `docker-compose.yml` file uses the following environment variables:

```yaml
# PostgreSQL
POSTGRES_USER=authuser
POSTGRES_PASSWORD=authpass
POSTGRES_DB=authdb

# Redis
REDIS_PASSWORD=redispass

# Volumes
POSTGRES_DATA_PATH=./data/postgres
REDIS_DATA_PATH=./data/redis
```

### Production Environment

For production, use `docker-compose.prod.yml` with:

```yaml
# Additional Production Settings
COMPOSE_PROJECT_NAME=enterprise-auth
RESTART_POLICY=unless-stopped
HEALTHCHECK_INTERVAL=30s
HEALTHCHECK_TIMEOUT=10s
HEALTHCHECK_RETRIES=3
```

## Configuration Files

### Backend Configuration File

Create `backend/app/core/config.py` for advanced configuration:

```python
from pydantic_settings import BaseSettings
from typing import List, Optional

class Settings(BaseSettings):
    # Base Configuration
    PROJECT_NAME: str = "Enterprise Auth API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 40
    
    # Redis
    REDIS_URL: str
    REDIS_MAX_CONNECTIONS: int = 50
    
    # CORS
    CORS_ORIGINS: List[str] = []
    CORS_ALLOW_CREDENTIALS: bool = True
    
    # Email
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: Optional[int] = None
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    
    # OAuth Providers
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
```

### Frontend Configuration File

Create `frontend/src/config/index.ts`:

```typescript
export const config = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Enterprise Auth',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    description: process.env.NEXT_PUBLIC_APP_DESCRIPTION || '',
  },
  api: {
    url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000'),
  },
  features: {
    oauth: process.env.NEXT_PUBLIC_ENABLE_OAUTH === 'true',
    twoFactor: process.env.NEXT_PUBLIC_ENABLE_2FA === 'true',
    magicLinks: process.env.NEXT_PUBLIC_ENABLE_MAGIC_LINKS === 'true',
  },
  auth: {
    tokenKey: 'auth_tokens',
    userKey: 'auth_user',
    refreshThreshold: 5 * 60 * 1000, // 5 minutes before expiry
  },
};
```

## Security Best Practices

### Secret Generation

Generate secure secrets using:

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate JWT_SECRET_KEY
openssl rand -hex 32

# Generate strong passwords
openssl rand -base64 32
```

### Environment Variable Security

1. **Never commit `.env` files** to version control
2. **Use different secrets** for each environment
3. **Rotate secrets regularly** in production
4. **Use secret management services** (AWS Secrets Manager, HashiCorp Vault)
5. **Restrict file permissions**: `chmod 600 .env`

### Production Checklist

- [ ] All secrets are unique and strong
- [ ] Debug mode is disabled
- [ ] CORS origins are properly configured
- [ ] SSL/TLS is enabled
- [ ] Rate limiting is configured
- [ ] Database connections are pooled
- [ ] Redis is password protected
- [ ] Email service is configured
- [ ] Monitoring is set up
- [ ] Backups are configured

## Advanced Configuration

### Custom Authentication Backends

Add custom authentication methods in `backend/app/core/auth.py`:

```python
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Custom authentication logic
    pass
```

### Custom Middleware

Add middleware in `backend/app/main.py`:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app = FastAPI()

# Security Headers
@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    return response
```

### Database Connection Pooling

Configure SQLAlchemy connection pooling:

```python
from sqlalchemy import create_engine
from sqlalchemy.pool import QueuePool

engine = create_engine(
    DATABASE_URL,
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=40,
    pool_timeout=30,
    pool_recycle=1800,
    pool_pre_ping=True,
)
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify PostgreSQL is running
   - Check network connectivity

2. **Redis Connection Failed**
   - Verify Redis is running
   - Check REDIS_URL format
   - Ensure Redis password is correct

3. **OAuth Not Working**
   - Verify client ID and secret
   - Check redirect URIs match
   - Ensure providers are enabled

4. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall rules
   - Enable "Less secure app access" for Gmail

### Debug Mode

Enable debug mode for development:

```env
# Backend
DEBUG=true
LOG_LEVEL=DEBUG

# Frontend
NODE_ENV=development
```

### Health Checks

Monitor service health:

- Backend: `GET /health`
- Frontend: `GET /api/health`
- Database: `docker-compose exec postgres pg_isready`
- Redis: `docker-compose exec redis redis-cli ping`

## Support

For configuration issues:
1. Check the [FAQ](FAQ.md)
2. Review [Common Issues](TROUBLESHOOTING.md)
3. Open a GitHub issue
4. Contact support

---

Last updated: January 2025