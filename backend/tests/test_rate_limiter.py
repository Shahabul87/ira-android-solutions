"""
Rate Limiter Middleware Tests

Tests for the rate limiting middleware including
sliding window algorithm and endpoint-specific limits.
"""

import asyncio
import time
from typing import Dict, Optional, Tuple
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
import redis.asyncio as redis
from fastapi import FastAPI, Request, Response
from fastapi.testclient import TestClient

from app.middleware.rate_limiter import (
    RateLimiter,
    RateLimitConfig,
    RateLimitMiddleware,
)


@pytest.fixture
def mock_redis_client() -> MagicMock:
    """Create mock Redis client."""
    client = MagicMock(spec=redis.Redis)
    client.pipeline = MagicMock()
    client.zremrangebyscore = AsyncMock()
    client.zcard = AsyncMock(return_value=0)
    client.zadd = AsyncMock()
    client.expire = AsyncMock()
    client.zrange = AsyncMock(return_value=[])
    return client


@pytest.fixture
def rate_limiter(mock_redis_client: MagicMock) -> RateLimiter:
    """Create rate limiter with mock Redis."""
    return RateLimiter(redis_client=mock_redis_client)


class TestRateLimiter:
    """Test RateLimiter class."""
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_within_limit(
        self,
        rate_limiter: RateLimiter,
        mock_redis_client: MagicMock
    ) -> None:
        """Test rate limit check when within limit."""
        # Setup mock pipeline
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[None, 3, None, None])
        mock_redis_client.pipeline.return_value.__aenter__ = AsyncMock(return_value=mock_pipe)
        mock_redis_client.pipeline.return_value.__aexit__ = AsyncMock()
        
        # Check rate limit
        allowed, remaining, reset_time = await rate_limiter.check_rate_limit(
            key="test:key",
            limit=10,
            window=60
        )
        
        assert allowed is True
        assert remaining == 6  # 10 - 3 - 1
        assert reset_time > 0
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_exceeded(
        self,
        rate_limiter: RateLimiter,
        mock_redis_client: MagicMock
    ) -> None:
        """Test rate limit check when limit exceeded."""
        # Setup mock pipeline
        mock_pipe = AsyncMock()
        mock_pipe.execute = AsyncMock(return_value=[None, 10, None, None])
        mock_redis_client.pipeline.return_value.__aenter__ = AsyncMock(return_value=mock_pipe)
        mock_redis_client.pipeline.return_value.__aexit__ = AsyncMock()
        
        # Mock zrange for reset time calculation
        current_time = time.time()
        mock_redis_client.zrange = AsyncMock(
            return_value=[(b"timestamp", current_time)]
        )
        
        # Check rate limit
        allowed, remaining, reset_time = await rate_limiter.check_rate_limit(
            key="test:key",
            limit=10,
            window=60
        )
        
        assert allowed is False
        assert remaining == 0
        assert reset_time > current_time
    
    @pytest.mark.asyncio
    async def test_check_rate_limit_redis_error(
        self,
        rate_limiter: RateLimiter,
        mock_redis_client: MagicMock
    ) -> None:
        """Test rate limit check when Redis error occurs."""
        # Setup mock to raise error
        mock_redis_client.pipeline.side_effect = Exception("Redis connection error")
        
        # Should fail open (allow request)
        allowed, remaining, reset_time = await rate_limiter.check_rate_limit(
            key="test:key",
            limit=10,
            window=60
        )
        
        assert allowed is True
        assert remaining == 10
        assert reset_time == 0
    
    def test_get_client_identifier_with_user(
        self,
        rate_limiter: RateLimiter
    ) -> None:
        """Test client identifier with authenticated user."""
        request = MagicMock(spec=Request)
        request.state.user_id = "user-123"
        
        identifier = rate_limiter.get_client_identifier(request)
        
        assert identifier == "user:user-123"
    
    def test_get_client_identifier_with_ip(
        self,
        rate_limiter: RateLimiter
    ) -> None:
        """Test client identifier with IP address."""
        request = MagicMock(spec=Request)
        request.state.user_id = None
        request.client = MagicMock()
        request.client.host = "192.168.1.1"
        request.headers = {"user-agent": "TestBrowser/1.0"}
        
        identifier = rate_limiter.get_client_identifier(request)
        
        assert identifier.startswith("ip:")
        assert len(identifier) == 19  # "ip:" + 16 chars
    
    def test_get_endpoint_config_auth_endpoints(
        self,
        rate_limiter: RateLimiter
    ) -> None:
        """Test endpoint configuration for auth endpoints."""
        # Login endpoint
        config = rate_limiter.get_endpoint_config("/api/v1/auth/login")
        assert config == RateLimitConfig.AUTH
        
        # Register endpoint
        config = rate_limiter.get_endpoint_config("/api/v1/auth/register")
        assert config == RateLimitConfig.AUTH
        
        # Password reset endpoint
        config = rate_limiter.get_endpoint_config("/api/v1/auth/forgot-password")
        assert config == RateLimitConfig.PASSWORD_RESET
        
        # Default endpoint
        config = rate_limiter.get_endpoint_config("/api/v1/users")
        assert config == RateLimitConfig.DEFAULT


class TestRateLimitMiddleware:
    """Test RateLimitMiddleware class."""
    
    @pytest.fixture
    def test_app(self) -> FastAPI:
        """Create test FastAPI app."""
        app = FastAPI()
        
        @app.get("/test")
        async def test_endpoint() -> Dict[str, str]:
            return {"message": "success"}
        
        @app.get("/health")
        async def health_check() -> Dict[str, str]:
            return {"status": "healthy"}
        
        return app
    
    @pytest.mark.asyncio
    async def test_middleware_allows_request(
        self,
        test_app: FastAPI,
        mock_redis_client: MagicMock
    ) -> None:
        """Test middleware allows request within limit."""
        with patch("app.middleware.rate_limiter.redis.from_url") as mock_from_url:
            mock_from_url.return_value = mock_redis_client
            
            # Setup mock pipeline
            mock_pipe = AsyncMock()
            mock_pipe.execute = AsyncMock(return_value=[None, 5, None, None])
            mock_redis_client.pipeline.return_value.__aenter__ = AsyncMock(return_value=mock_pipe)
            mock_redis_client.pipeline.return_value.__aexit__ = AsyncMock()
            
            # Add middleware
            test_app.add_middleware(
                RateLimitMiddleware,
                redis_url="redis://localhost:6379"
            )
            
            # Make request
            client = TestClient(test_app)
            response = client.get("/test")
            
            assert response.status_code == 200
            assert response.json() == {"message": "success"}
            assert "X-RateLimit-Limit" in response.headers
            assert "X-RateLimit-Remaining" in response.headers
    
    @pytest.mark.asyncio
    async def test_middleware_blocks_request(
        self,
        test_app: FastAPI,
        mock_redis_client: MagicMock
    ) -> None:
        """Test middleware blocks request when limit exceeded."""
        with patch("app.middleware.rate_limiter.redis.from_url") as mock_from_url:
            mock_from_url.return_value = mock_redis_client
            
            # Setup mock pipeline to indicate limit exceeded
            mock_pipe = AsyncMock()
            mock_pipe.execute = AsyncMock(return_value=[None, 100, None, None])
            mock_redis_client.pipeline.return_value.__aenter__ = AsyncMock(return_value=mock_pipe)
            mock_redis_client.pipeline.return_value.__aexit__ = AsyncMock()
            
            # Mock zrange for reset time
            current_time = time.time()
            mock_redis_client.zrange = AsyncMock(
                return_value=[(b"timestamp", current_time)]
            )
            
            # Add middleware
            test_app.add_middleware(
                RateLimitMiddleware,
                redis_url="redis://localhost:6379"
            )
            
            # Make request
            client = TestClient(test_app)
            response = client.get("/test")
            
            assert response.status_code == 429
            assert response.json()["error"]["code"] == "RATE_LIMIT_EXCEEDED"
            assert "Retry-After" in response.headers
    
    @pytest.mark.asyncio
    async def test_middleware_skips_health_check(
        self,
        test_app: FastAPI,
        mock_redis_client: MagicMock
    ) -> None:
        """Test middleware skips health check endpoint."""
        with patch("app.middleware.rate_limiter.redis.from_url") as mock_from_url:
            mock_from_url.return_value = mock_redis_client
            
            # Add middleware
            test_app.add_middleware(
                RateLimitMiddleware,
                redis_url="redis://localhost:6379"
            )
            
            # Make request to health endpoint
            client = TestClient(test_app)
            response = client.get("/health")
            
            assert response.status_code == 200
            assert response.json() == {"status": "healthy"}
            
            # Redis should not be called
            mock_redis_client.pipeline.assert_not_called()
    
    def test_middleware_disabled_without_redis(
        self,
        test_app: FastAPI
    ) -> None:
        """Test middleware is disabled when Redis not configured."""
        # Add middleware without Redis URL
        test_app.add_middleware(
            RateLimitMiddleware,
            redis_url=None
        )
        
        # Make request
        client = TestClient(test_app)
        response = client.get("/test")
        
        assert response.status_code == 200
        assert response.json() == {"message": "success"}


class TestRateLimitConfig:
    """Test RateLimitConfig settings."""
    
    def test_default_config(self) -> None:
        """Test default rate limit configuration."""
        config = RateLimitConfig.DEFAULT
        assert config["requests"] == 100
        assert config["window"] == 60
        assert "message" in config
    
    def test_auth_config(self) -> None:
        """Test auth endpoint rate limit configuration."""
        config = RateLimitConfig.AUTH
        assert config["requests"] == 5
        assert config["window"] == 300
        assert "authentication" in config["message"].lower()
    
    def test_password_reset_config(self) -> None:
        """Test password reset rate limit configuration."""
        config = RateLimitConfig.PASSWORD_RESET
        assert config["requests"] == 3
        assert config["window"] == 3600
        assert "password reset" in config["message"].lower()
    
    def test_api_key_config(self) -> None:
        """Test API key rate limit configuration."""
        config = RateLimitConfig.API_KEY
        assert config["requests"] == 1000
        assert config["window"] == 60
        assert "API" in config["message"]