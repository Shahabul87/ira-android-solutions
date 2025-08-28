"""
Health Check Endpoints

Provides health check endpoints for monitoring and load balancer health checks.
Includes database connectivity and dependency health checks.
"""

from typing import Dict, Any
import asyncio
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session

settings = get_settings()
logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/")
async def health_check() -> Dict[str, Any]:
    """
    Basic health check endpoint.
    
    Returns basic service health information without dependencies.
    Used by load balancers for quick health checks.
    
    Returns:
        Dict: Basic health status
    """
    return {
        "status": "healthy",
        "service": "enterprise-auth-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat()
    }


@router.get("/detailed")
async def detailed_health_check(
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    Detailed health check endpoint.
    
    Checks the health of all critical dependencies including
    database connectivity and external services.
    
    Args:
        db: Database session dependency
        
    Returns:
        Dict: Detailed health status of all dependencies
        
    Raises:
        HTTPException: If any critical dependency is unhealthy
    """
    health_status = {
        "status": "healthy",
        "service": "enterprise-auth-backend",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "timestamp": datetime.utcnow().isoformat(),
        "dependencies": {}
    }
    
    # Check database connectivity
    try:
        start_time = datetime.utcnow()
        result = await db.execute(text("SELECT 1"))
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        health_status["dependencies"]["database"] = {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "details": "PostgreSQL connection successful"
        }
        
        logger.info("Database health check passed", response_time_ms=response_time)
        
    except Exception as e:
        health_status["dependencies"]["database"] = {
            "status": "unhealthy",
            "error": str(e),
            "details": "Failed to connect to PostgreSQL"
        }
        health_status["status"] = "unhealthy"
        
        logger.error("Database health check failed", error=str(e))
    
    # Check Redis connectivity (if configured)
    try:
        import redis.asyncio as redis
        
        redis_client = redis.from_url(str(settings.REDIS_URL))
        start_time = datetime.utcnow()
        await redis_client.ping()
        end_time = datetime.utcnow()
        response_time = (end_time - start_time).total_seconds() * 1000
        
        health_status["dependencies"]["redis"] = {
            "status": "healthy",
            "response_time_ms": round(response_time, 2),
            "details": "Redis connection successful"
        }
        
        await redis_client.close()
        logger.info("Redis health check passed", response_time_ms=response_time)
        
    except Exception as e:
        health_status["dependencies"]["redis"] = {
            "status": "unhealthy",
            "error": str(e),
            "details": "Failed to connect to Redis"
        }
        
        # Redis is not critical, don't mark overall status as unhealthy
        logger.warning("Redis health check failed", error=str(e))
    
    # If any critical dependency is unhealthy, return 503
    if health_status["status"] == "unhealthy":
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=health_status
        )
    
    return health_status


@router.get("/ready")
async def readiness_check(
    db: AsyncSession = Depends(get_db_session)
) -> Dict[str, Any]:
    """
    Kubernetes readiness probe endpoint.
    
    Checks if the service is ready to accept traffic.
    More strict than liveness check.
    
    Args:
        db: Database session dependency
        
    Returns:
        Dict: Readiness status
        
    Raises:
        HTTPException: If service is not ready
    """
    try:
        # Check database connectivity
        await db.execute(text("SELECT 1"))
        
        return {
            "status": "ready",
            "service": "enterprise-auth-backend",
            "timestamp": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        logger.error("Readiness check failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail={
                "status": "not_ready",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
        )


@router.get("/metrics")
async def metrics_endpoint() -> Dict[str, Any]:
    """
    Basic metrics endpoint.
    
    Provides basic application metrics for monitoring.
    In production, consider using Prometheus metrics format.
    
    Returns:
        Dict: Application metrics
    """
    import psutil
    import time
    
    # Get system metrics
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "service": "enterprise-auth-backend",
        "version": settings.VERSION,
        "uptime_seconds": time.time() - psutil.boot_time(),
        "system": {
            "cpu_percent": cpu_percent,
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": (disk.used / disk.total) * 100
            }
        },
        "timestamp": datetime.utcnow().isoformat()
    }