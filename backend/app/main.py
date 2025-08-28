"""
FastAPI Application Entry Point

This module sets up the FastAPI application with all necessary middleware,
routers, and configuration for the enterprise authentication template.
"""

from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import get_settings
from app.core.database import close_db, init_db
from app.core.log_config import setup_logging
from app.middleware.rate_limiter import RateLimitMiddleware

# Initialize structured logging
setup_logging()
logger = structlog.get_logger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan manager.
    
    Handles startup and shutdown events for the FastAPI application.
    """
    # Startup
    logger.info("Starting Enterprise Auth Template API", version=settings.VERSION)
    
    # Initialize database
    await init_db()
    logger.info("Database initialized")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Enterprise Auth Template API")
    await close_db()
    logger.info("Database connections closed")


def create_application() -> FastAPI:
    """
    Create and configure the FastAPI application.
    
    Returns:
        FastAPI: Configured FastAPI application instance
    """
    app = FastAPI(
        title=settings.PROJECT_NAME,
        description="Enterprise-grade authentication template with FastAPI",
        version=settings.VERSION,
        docs_url=settings.DOCS_URL if settings.ENVIRONMENT == "development" else None,
        redoc_url=settings.REDOC_URL if settings.ENVIRONMENT == "development" else None,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        lifespan=lifespan,
    )

    # Set up CORS middleware
    if settings.ALLOWED_ORIGINS:
        # Remove trailing slashes from origins for proper CORS matching
        origins = [str(origin).rstrip('/') for origin in settings.ALLOWED_ORIGINS]
        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=settings.ALLOWED_METHODS,
            allow_headers=settings.ALLOWED_HEADERS,
        )

    # Add trusted host middleware for security
    if settings.ENVIRONMENT == "production":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS or ["*"]
        )

    # Add rate limiting middleware
    redis_url = str(settings.REDIS_URL) if settings.REDIS_URL else None
    if redis_url:
        app.add_middleware(
            RateLimitMiddleware,
            redis_url=redis_url
        )
        logger.info("Rate limiting enabled")
    else:
        logger.warning("Rate limiting disabled - Redis not configured")

    # Include API routers
    from app.api import api_router
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)

    # Health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint for load balancers and monitoring."""
        return {
            "status": "healthy",
            "service": "enterprise-auth-backend",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }

    # Root endpoint
    @app.get("/")
    async def root():
        """Root endpoint with basic API information."""
        return {
            "message": "Enterprise Authentication Template API",
            "version": settings.VERSION,
            "docs_url": f"{settings.API_V1_PREFIX}/docs" if settings.ENVIRONMENT == "development" else None,
            "health_url": "/health"
        }

    return app


# Create the FastAPI application
app = create_application()

if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info",
        access_log=True,
    )