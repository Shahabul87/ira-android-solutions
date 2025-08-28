"""
Application Configuration

Centralized configuration management using Pydantic Settings.
Loads configuration from environment variables with proper validation.
"""

import secrets
from functools import lru_cache
from typing import Any, List, Optional

from pydantic import (
    AnyHttpUrl,
    EmailStr,
    HttpUrl,
    PostgresDsn,
    RedisDsn,
    field_validator,
)
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    Uses Pydantic Settings for automatic validation and type conversion.
    """
    
    # ===========================================
    # GENERAL SETTINGS
    # ===========================================
    PROJECT_NAME: str = "Enterprise Auth Template"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # ===========================================
    # API SETTINGS
    # ===========================================
    API_V1_PREFIX: str = "/api/v1"
    DOCS_URL: str = "/docs"
    REDOC_URL: str = "/redoc"
    
    # ===========================================
    # SECURITY SETTINGS
    # ===========================================
    SECRET_KEY: str = secrets.token_urlsafe(32)
    ENCRYPTION_KEY: Optional[str] = None  # For 2FA backup codes encryption
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    BCRYPT_ROUNDS: int = 12
    
    # ===========================================
    # DATABASE SETTINGS
    # ===========================================
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "auth_template_dev"
    DB_USER: str = "postgres"
    DB_PASSWORD: str = "postgres"
    
    # Connection Pool Settings
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 30
    DB_POOL_TIMEOUT: int = 30
    
    DATABASE_URL: Optional[PostgresDsn] = None
    
    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def assemble_db_connection(cls, v: Optional[str], info) -> Any:
        """Construct database URL from individual components if not provided."""
        if isinstance(v, str):
            return v
        
        # Get values from the validation context
        if hasattr(info, 'data') and info.data:
            values = info.data
        else:
            values = {}
            
        return PostgresDsn.build(
            scheme="postgresql+asyncpg",
            username=values.get("DB_USER"),
            password=values.get("DB_PASSWORD"),
            host=values.get("DB_HOST"),
            port=values.get("DB_PORT"),
            path=f"/{values.get('DB_NAME') or ''}",
        )
    
    # ===========================================
    # REDIS SETTINGS
    # ===========================================
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    REDIS_DB: int = 0
    
    REDIS_URL: Optional[RedisDsn] = None
    
    @field_validator("REDIS_URL", mode="before")
    @classmethod
    def assemble_redis_connection(cls, v: Optional[str], info) -> Any:
        """Construct Redis URL from individual components if not provided."""
        if isinstance(v, str):
            return v
        
        # Get values from the validation context
        if hasattr(info, 'data') and info.data:
            values = info.data
        else:
            values = {}
            
        return RedisDsn.build(
            scheme="redis",
            password=values.get("REDIS_PASSWORD") or None,
            host=values.get("REDIS_HOST"),
            port=values.get("REDIS_PORT"),
            path=f"/{values.get('REDIS_DB') or 0}",
        )
    
    # Session Settings
    SESSION_TIMEOUT_MINUTES: int = 1440  # 24 hours
    
    # ===========================================
    # CORS SETTINGS
    # ===========================================
    ALLOWED_ORIGINS: List[AnyHttpUrl] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001"
    ]
    ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    ALLOWED_HEADERS: List[str] = ["*"]
    ALLOWED_HOSTS: Optional[List[str]] = None
    
    # ===========================================
    # EMAIL SETTINGS
    # ===========================================
    EMAIL_PROVIDER: str = "smtp"  # smtp, sendgrid, mailgun, ses
    
    # SMTP Settings
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_TLS: bool = True
    SMTP_SSL: bool = False
    
    # SendGrid Settings
    SENDGRID_API_KEY: Optional[str] = None
    
    # Email Templates
    EMAIL_FROM: Optional[EmailStr] = None
    EMAIL_FROM_NAME: str = "Enterprise Auth Template"
    
    # ===========================================
    # OAUTH PROVIDER SETTINGS
    # ===========================================
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # GitHub OAuth
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    
    # Discord OAuth
    DISCORD_CLIENT_ID: Optional[str] = None
    DISCORD_CLIENT_SECRET: Optional[str] = None
    
    # ===========================================
    # FRONTEND SETTINGS
    # ===========================================
    FRONTEND_URL: AnyHttpUrl = "http://localhost:3000"
    BACKEND_URL: AnyHttpUrl = "http://localhost:8000"
    
    # ===========================================
    # RATE LIMITING
    # ===========================================
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # ===========================================
    # LOGGING SETTINGS
    # ===========================================
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"  # json or text
    LOG_FILE: Optional[str] = None
    
    # ===========================================
    # MONITORING & OBSERVABILITY
    # ===========================================
    SENTRY_DSN: Optional[HttpUrl] = None
    METRICS_ENABLED: bool = True
    METRICS_PORT: int = 9090
    
    # ===========================================
    # WEBAUTHN SETTINGS
    # ===========================================
    WEBAUTHN_RP_ID: str = "localhost"
    WEBAUTHN_RP_NAME: str = "Enterprise Auth Template"
    WEBAUTHN_ORIGIN: AnyHttpUrl = "http://localhost:3000"
    
    # ===========================================
    # CELERY SETTINGS
    # ===========================================
    CELERY_BROKER_URL: Optional[RedisDsn] = None
    CELERY_RESULT_BACKEND: Optional[RedisDsn] = None
    
    @field_validator("CELERY_BROKER_URL", mode="before")
    @classmethod
    def assemble_celery_broker(cls, v: Optional[str], info) -> Any:
        """Construct Celery broker URL if not provided."""
        if isinstance(v, str):
            return v
        
        # Get values from the validation context
        if hasattr(info, 'data') and info.data:
            values = info.data
        else:
            values = {}
            
        redis_url = values.get("REDIS_URL")
        if redis_url:
            # Use database 1 for Celery broker
            return str(redis_url).replace("/0", "/1")
        return None
    
    @field_validator("CELERY_RESULT_BACKEND", mode="before")
    @classmethod
    def assemble_celery_result_backend(cls, v: Optional[str], info) -> Any:
        """Construct Celery result backend URL if not provided."""
        if isinstance(v, str):
            return v
        
        # Get values from the validation context
        if hasattr(info, 'data') and info.data:
            values = info.data
        else:
            values = {}
            
        redis_url = values.get("REDIS_URL")
        if redis_url:
            # Use database 2 for Celery results
            return str(redis_url).replace("/0", "/2")
        return None
    
    # Flower (Celery Monitoring)
    FLOWER_PORT: int = 5555
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    
    Using lru_cache to avoid reading environment variables multiple times.
    
    Returns:
        Settings: Application configuration
    """
    return Settings()