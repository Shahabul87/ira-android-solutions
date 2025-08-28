"""
Rate Limiting Middleware

Implements sliding window rate limiting with Redis backend
to prevent API abuse and brute force attacks.
"""

import hashlib
import time
from typing import Callable, Dict, Optional, Tuple

import redis.asyncio as redis
import structlog
from fastapi import HTTPException, Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger(__name__)


class RateLimitConfig:
    """Configuration for different rate limit tiers."""
    
    # Default limits
    DEFAULT = {
        "requests": 100,
        "window": 60,  # seconds
        "message": "Too many requests. Please try again later."
    }
    
    # Strict limits for sensitive endpoints
    AUTH = {
        "requests": 5,
        "window": 300,  # 5 minutes
        "message": "Too many authentication attempts. Please wait before trying again."
    }
    
    # Password reset limits
    PASSWORD_RESET = {
        "requests": 3,
        "window": 3600,  # 1 hour
        "message": "Too many password reset requests. Please wait before trying again."
    }
    
    # API key limits (higher)
    API_KEY = {
        "requests": 1000,
        "window": 60,
        "message": "API rate limit exceeded."
    }


class RateLimiter:
    """
    Redis-based rate limiter using sliding window algorithm.
    
    Provides efficient rate limiting with minimal memory usage
    and accurate request counting.
    """
    
    def __init__(self, redis_client: Optional[redis.Redis] = None) -> None:
        """
        Initialize rate limiter.
        
        Args:
            redis_client: Redis client instance
        """
        self.redis_client = redis_client
        self.enabled = bool(redis_client)
        
        if not self.enabled:
            logger.warning("Rate limiting disabled - Redis not configured")
    
    async def check_rate_limit(
        self,
        key: str,
        limit: int,
        window: int
    ) -> Tuple[bool, int, int]:
        """
        Check if request is within rate limit.
        
        Args:
            key: Unique identifier for rate limit bucket
            limit: Maximum requests allowed
            window: Time window in seconds
            
        Returns:
            Tuple of (allowed, remaining, reset_time)
        """
        if not self.enabled or not self.redis_client:
            return True, limit, 0
        
        try:
            now = time.time()
            window_start = now - window
            
            # Use Redis pipeline for atomic operations
            async with self.redis_client.pipeline() as pipe:
                # Remove old entries outside the window
                await pipe.zremrangebyscore(key, 0, window_start)
                
                # Count requests in current window
                await pipe.zcard(key)
                
                # Add current request
                await pipe.zadd(key, {str(now): now})
                
                # Set expiry
                await pipe.expire(key, window)
                
                # Execute pipeline
                results = await pipe.execute()
                
                # Get request count (before adding current)
                request_count = results[1]
                
                # Check if within limit
                if request_count >= limit:
                    # Get oldest request time for reset calculation
                    oldest = await self.redis_client.zrange(
                        key, 0, 0, withscores=True
                    )
                    reset_time = int(oldest[0][1] + window) if oldest else int(now + window)
                    
                    return False, 0, reset_time
                
                remaining = limit - request_count - 1
                reset_time = int(now + window)
                
                return True, remaining, reset_time
                
        except ConnectionError as e:
            # Handle Python's built-in ConnectionError (Redis connection issues)
            logger.warning(
                "Redis connection failed - disabling rate limiting",
                error=str(e),
                key=key
            )
            # Disable rate limiting if Redis is unavailable
            self.enabled = False
            return True, limit, 0
        except Exception as e:
            # Catch all other exceptions including Redis-specific ones
            error_message = str(e)
            if "Connection" in error_message or "connection" in error_message:
                logger.warning(
                    "Redis connection issue - disabling rate limiting",
                    error=error_message,
                    key=key
                )
                # Disable rate limiting if Redis is unavailable
                self.enabled = False
            else:
                logger.error(
                    "Rate limit check failed",
                    error=error_message,
                    key=key
                )
            # Fail open on errors
            return True, limit, 0
    
    def get_client_identifier(self, request: Request) -> str:
        """
        Get unique client identifier from request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Unique client identifier
        """
        # Try to get authenticated user ID
        user_id = getattr(request.state, "user_id", None)
        if user_id:
            return f"user:{user_id}"
        
        # Fall back to IP address
        client_ip = request.client.host if request.client else "unknown"
        
        # Include user agent for better fingerprinting
        user_agent = request.headers.get("user-agent", "")
        fingerprint = f"{client_ip}:{user_agent}"
        
        # Hash for privacy
        hash_object = hashlib.sha256(fingerprint.encode())
        return f"ip:{hash_object.hexdigest()[:16]}"
    
    def get_endpoint_config(self, path: str) -> Dict[str, int]:
        """
        Get rate limit configuration for endpoint.
        
        Args:
            path: Request path
            
        Returns:
            Rate limit configuration
        """
        # Authentication endpoints
        if path.startswith("/api/v1/auth/login"):
            return RateLimitConfig.AUTH
        elif path.startswith("/api/v1/auth/register"):
            return RateLimitConfig.AUTH
        elif path.startswith("/api/v1/auth/forgot-password"):
            return RateLimitConfig.PASSWORD_RESET
        elif path.startswith("/api/v1/auth/reset-password"):
            return RateLimitConfig.PASSWORD_RESET
        
        # Default for all other endpoints
        return RateLimitConfig.DEFAULT


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI middleware for rate limiting.
    
    Applies rate limiting to all API endpoints with
    configurable limits per endpoint.
    """
    
    def __init__(self, app, redis_url: Optional[str] = None) -> None:
        """
        Initialize middleware.
        
        Args:
            app: FastAPI application
            redis_url: Redis connection URL
        """
        super().__init__(app)
        self.redis_client: Optional[redis.Redis] = None
        self.rate_limiter: Optional[RateLimiter] = None
        
        if redis_url:
            try:
                self.redis_client = redis.from_url(
                    redis_url,
                    encoding="utf-8",
                    decode_responses=True,
                    socket_connect_timeout=2,  # 2 second timeout
                    socket_timeout=2
                )
                self.rate_limiter = RateLimiter(self.redis_client)
                logger.info("Rate limiting middleware initialized with Redis")
            except Exception as e:
                logger.warning(
                    "Failed to initialize Redis client - rate limiting disabled",
                    error=str(e),
                    redis_url=redis_url
                )
                # Don't create rate_limiter if Redis connection fails
                self.redis_client = None
                self.rate_limiter = None
        else:
            logger.info("Rate limiting disabled - no Redis URL provided")
    
    async def dispatch(
        self,
        request: Request,
        call_next: Callable
    ) -> Response:
        """
        Process request with rate limiting.
        
        Args:
            request: Incoming request
            call_next: Next middleware/handler
            
        Returns:
            Response or rate limit error
        """
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        # Skip if rate limiting not enabled
        if not self.rate_limiter:
            return await call_next(request)
        
        # Get client identifier and endpoint config
        client_id = self.rate_limiter.get_client_identifier(request)
        config = self.rate_limiter.get_endpoint_config(request.url.path)
        
        # Build rate limit key
        endpoint_key = request.url.path.replace("/", ":")
        rate_limit_key = f"rate_limit:{endpoint_key}:{client_id}"
        
        # Check rate limit
        allowed, remaining, reset_time = await self.rate_limiter.check_rate_limit(
            key=rate_limit_key,
            limit=config["requests"],
            window=config["window"]
        )
        
        # Add rate limit headers
        response_headers = {
            "X-RateLimit-Limit": str(config["requests"]),
            "X-RateLimit-Remaining": str(remaining),
            "X-RateLimit-Reset": str(reset_time)
        }
        
        if not allowed:
            # Rate limit exceeded
            logger.warning(
                "Rate limit exceeded",
                client_id=client_id,
                endpoint=request.url.path,
                limit=config["requests"],
                window=config["window"]
            )
            
            # Calculate retry after
            retry_after = reset_time - int(time.time())
            response_headers["Retry-After"] = str(retry_after)
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={
                    "success": False,
                    "error": {
                        "code": "RATE_LIMIT_EXCEEDED",
                        "message": config["message"]
                    },
                    "metadata": {
                        "retry_after": retry_after,
                        "reset_time": reset_time
                    }
                },
                headers=response_headers
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers to response
        for header, value in response_headers.items():
            response.headers[header] = value
        
        return response


async def get_rate_limiter() -> Optional[RateLimiter]:
    """
    Get rate limiter instance for dependency injection.
    
    Returns:
        RateLimiter instance or None if not configured
    """
    redis_url = str(settings.REDIS_URL) if settings.REDIS_URL else None
    
    if not redis_url:
        return None
    
    try:
        redis_client = redis.from_url(
            redis_url,
            encoding="utf-8",
            decode_responses=True
        )
        return RateLimiter(redis_client)
    except Exception as e:
        logger.error(
            "Failed to create rate limiter",
            error=str(e)
        )
        return None