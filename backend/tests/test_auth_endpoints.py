"""
Authentication Endpoint Tests

Comprehensive tests for all authentication endpoints including
login, registration, password reset, and token management.
"""

import pytest
from datetime import datetime, timedelta
from typing import Dict, Generator
from unittest.mock import AsyncMock, MagicMock, patch

import pytest_asyncio
from fastapi import status
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.main import app
from app.models.user import User
from app.core.security import create_access_token, get_password_hash
from app.services.auth_service import AuthService


@pytest.fixture
def client() -> TestClient:
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def mock_db_session() -> AsyncSession:
    """Create mock database session."""
    session = MagicMock(spec=AsyncSession)
    session.commit = AsyncMock()
    session.rollback = AsyncMock()
    session.execute = AsyncMock()
    return session


@pytest.fixture
def sample_user_data() -> Dict[str, str]:
    """Sample user data for testing."""
    return {
        "email": "test@example.com",
        "password": "SecurePassword123!",
        "first_name": "Test",
        "last_name": "User"
    }


@pytest.fixture
def mock_user() -> User:
    """Create mock user object."""
    user = MagicMock(spec=User)
    user.id = "test-user-id"
    user.email = "test@example.com"
    user.first_name = "Test"
    user.last_name = "User"
    user.password_hash = get_password_hash("SecurePassword123!")
    user.is_active = True
    user.is_verified = True
    user.failed_login_attempts = 0
    user.locked_until = None
    user.created_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    user.last_login = None
    user.roles = []
    user.full_name = "Test User"
    return user


class TestRegistrationEndpoint:
    """Test user registration endpoint."""
    
    def test_successful_registration(
        self,
        client: TestClient,
        sample_user_data: Dict[str, str]
    ) -> None:
        """Test successful user registration."""
        with patch("app.api.v1.auth.get_db_session") as mock_get_db:
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                # Setup mocks
                mock_service = MockAuthService.return_value
                mock_service.register_user = AsyncMock(return_value=MagicMock(
                    id="new-user-id",
                    email=sample_user_data["email"],
                    first_name=sample_user_data["first_name"],
                    last_name=sample_user_data["last_name"],
                    is_active=False,
                    is_verified=False,
                    roles=[],
                    created_at=datetime.utcnow().isoformat(),
                    last_login=None
                ))
                
                # Make request
                response = client.post(
                    "/api/v1/auth/register",
                    json=sample_user_data
                )
                
                # Assertions
                assert response.status_code == status.HTTP_201_CREATED
                data = response.json()
                assert data["email"] == sample_user_data["email"]
                assert data["first_name"] == sample_user_data["first_name"]
                assert data["last_name"] == sample_user_data["last_name"]
    
    def test_registration_duplicate_email(
        self,
        client: TestClient,
        sample_user_data: Dict[str, str]
    ) -> None:
        """Test registration with duplicate email."""
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                # Setup mock to raise ValueError
                mock_service = MockAuthService.return_value
                mock_service.register_user = AsyncMock(
                    side_effect=ValueError("Email already exists")
                )
                
                # Make request
                response = client.post(
                    "/api/v1/auth/register",
                    json=sample_user_data
                )
                
                # Assertions
                assert response.status_code == status.HTTP_400_BAD_REQUEST
                assert "Email already exists" in response.json()["detail"]
    
    def test_registration_weak_password(
        self,
        client: TestClient
    ) -> None:
        """Test registration with weak password."""
        weak_password_data = {
            "email": "test@example.com",
            "password": "weak",
            "first_name": "Test",
            "last_name": "User"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.register_user = AsyncMock(
                    side_effect=ValueError("Password is too weak")
                )
                
                response = client.post(
                    "/api/v1/auth/register",
                    json=weak_password_data
                )
                
                assert response.status_code == status.HTTP_400_BAD_REQUEST
                assert "Password is too weak" in response.json()["detail"]


class TestLoginEndpoint:
    """Test user login endpoint."""
    
    def test_successful_login(
        self,
        client: TestClient,
        mock_user: User
    ) -> None:
        """Test successful login."""
        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.authenticate_user = AsyncMock(return_value=MagicMock(
                    access_token="test-access-token",
                    refresh_token="test-refresh-token",
                    token_type="bearer",
                    expires_in=1800,
                    user=MagicMock(
                        id=mock_user.id,
                        email=mock_user.email,
                        first_name=mock_user.first_name,
                        last_name=mock_user.last_name,
                        is_active=True,
                        is_verified=True,
                        roles=[],
                        created_at=datetime.utcnow().isoformat(),
                        last_login=datetime.utcnow().isoformat()
                    )
                ))
                
                response = client.post(
                    "/api/v1/auth/login",
                    json=login_data
                )
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert "access_token" in data
                assert "refresh_token" in data
                assert data["token_type"] == "bearer"
                assert data["user"]["email"] == login_data["email"]
    
    def test_login_invalid_credentials(
        self,
        client: TestClient
    ) -> None:
        """Test login with invalid credentials."""
        login_data = {
            "email": "test@example.com",
            "password": "WrongPassword"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                from app.services.auth_service import AuthenticationError
                
                mock_service = MockAuthService.return_value
                mock_service.authenticate_user = AsyncMock(
                    side_effect=AuthenticationError("Invalid credentials")
                )
                
                response = client.post(
                    "/api/v1/auth/login",
                    json=login_data
                )
                
                assert response.status_code == status.HTTP_401_UNAUTHORIZED
                assert "Invalid email or password" in response.json()["detail"]
    
    def test_login_unverified_email(
        self,
        client: TestClient
    ) -> None:
        """Test login with unverified email."""
        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                from app.services.auth_service import EmailNotVerifiedError
                
                mock_service = MockAuthService.return_value
                mock_service.authenticate_user = AsyncMock(
                    side_effect=EmailNotVerifiedError("Email not verified")
                )
                
                response = client.post(
                    "/api/v1/auth/login",
                    json=login_data
                )
                
                assert response.status_code == status.HTTP_403_FORBIDDEN
                assert "Email not verified" in response.json()["detail"]
    
    def test_login_locked_account(
        self,
        client: TestClient
    ) -> None:
        """Test login with locked account."""
        login_data = {
            "email": "test@example.com",
            "password": "SecurePassword123!"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                from app.services.auth_service import AccountLockedError
                
                mock_service = MockAuthService.return_value
                mock_service.authenticate_user = AsyncMock(
                    side_effect=AccountLockedError("Account is locked")
                )
                
                response = client.post(
                    "/api/v1/auth/login",
                    json=login_data
                )
                
                assert response.status_code == status.HTTP_423_LOCKED
                assert "Account is locked" in response.json()["detail"]


class TestTokenRefreshEndpoint:
    """Test token refresh endpoint."""
    
    def test_successful_token_refresh(
        self,
        client: TestClient
    ) -> None:
        """Test successful token refresh."""
        refresh_data = {
            "refresh_token": "valid-refresh-token"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.refresh_access_token = AsyncMock(return_value={
                    "access_token": "new-access-token",
                    "token_type": "bearer",
                    "expires_in": 1800
                })
                
                response = client.post(
                    "/api/v1/auth/refresh",
                    json=refresh_data
                )
                
                assert response.status_code == status.HTTP_200_OK
                data = response.json()
                assert data["access_token"] == "new-access-token"
                assert data["token_type"] == "bearer"
                assert data["expires_in"] == 1800
    
    def test_invalid_refresh_token(
        self,
        client: TestClient
    ) -> None:
        """Test refresh with invalid token."""
        refresh_data = {
            "refresh_token": "invalid-token"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                from app.services.auth_service import AuthenticationError
                
                mock_service = MockAuthService.return_value
                mock_service.refresh_access_token = AsyncMock(
                    side_effect=AuthenticationError("Invalid token")
                )
                
                response = client.post(
                    "/api/v1/auth/refresh",
                    json=refresh_data
                )
                
                assert response.status_code == status.HTTP_401_UNAUTHORIZED
                assert "Invalid or expired refresh token" in response.json()["detail"]


class TestPasswordResetEndpoints:
    """Test password reset endpoints."""
    
    def test_forgot_password_request(
        self,
        client: TestClient
    ) -> None:
        """Test password reset request."""
        reset_request = {
            "email": "test@example.com"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.request_password_reset = AsyncMock(return_value=True)
                
                response = client.post(
                    "/api/v1/auth/forgot-password",
                    json=reset_request
                )
                
                assert response.status_code == status.HTTP_200_OK
                # Should always return success for security
                assert "If an account with that email exists" in response.json()["message"]
    
    def test_reset_password_with_token(
        self,
        client: TestClient
    ) -> None:
        """Test password reset with valid token."""
        reset_data = {
            "token": "valid-reset-token",
            "new_password": "NewSecurePassword123!"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.reset_password = AsyncMock(return_value=True)
                
                response = client.post(
                    "/api/v1/auth/reset-password",
                    json=reset_data
                )
                
                assert response.status_code == status.HTTP_200_OK
                assert "Password has been reset successfully" in response.json()["message"]
    
    def test_reset_password_invalid_token(
        self,
        client: TestClient
    ) -> None:
        """Test password reset with invalid token."""
        reset_data = {
            "token": "invalid-token",
            "new_password": "NewSecurePassword123!"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                from app.services.auth_service import AuthenticationError
                
                mock_service = MockAuthService.return_value
                mock_service.reset_password = AsyncMock(
                    side_effect=AuthenticationError("Invalid token")
                )
                
                response = client.post(
                    "/api/v1/auth/reset-password",
                    json=reset_data
                )
                
                assert response.status_code == status.HTTP_400_BAD_REQUEST
                assert "Invalid or expired reset token" in response.json()["detail"]


class TestEmailVerificationEndpoints:
    """Test email verification endpoints."""
    
    def test_verify_email(
        self,
        client: TestClient
    ) -> None:
        """Test email verification."""
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.verify_email = AsyncMock()
                
                response = client.get(
                    "/api/v1/auth/verify-email/valid-token"
                )
                
                assert response.status_code == status.HTTP_200_OK
                assert "Email verified successfully" in response.json()["message"]
    
    def test_resend_verification(
        self,
        client: TestClient
    ) -> None:
        """Test resend verification email."""
        resend_data = {
            "email": "test@example.com"
        }
        
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.resend_verification_email = AsyncMock(return_value=True)
                
                response = client.post(
                    "/api/v1/auth/resend-verification",
                    json=resend_data
                )
                
                assert response.status_code == status.HTTP_200_OK
                # Should always return success for security
                assert "If an account with that email exists" in response.json()["message"]


class TestLogoutEndpoint:
    """Test logout endpoint."""
    
    def test_successful_logout(
        self,
        client: TestClient
    ) -> None:
        """Test successful logout."""
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.logout_user = AsyncMock(return_value=True)
                
                response = client.post(
                    "/api/v1/auth/logout",
                    headers={"Authorization": "Bearer test-token"}
                )
                
                assert response.status_code == status.HTTP_200_OK
                assert "Successfully logged out" in response.json()["message"]
    
    def test_logout_without_token(
        self,
        client: TestClient
    ) -> None:
        """Test logout without token."""
        with patch("app.api.v1.auth.get_db_session"):
            with patch("app.api.v1.auth.AuthService") as MockAuthService:
                mock_service = MockAuthService.return_value
                mock_service.logout_user = AsyncMock(return_value=False)
                
                response = client.post("/api/v1/auth/logout")
                
                # Should still return success for security
                assert response.status_code == status.HTTP_200_OK
                assert "Successfully logged out" in response.json()["message"]