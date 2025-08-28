"""
Security Module Tests

Tests for the core security utilities including JWT token creation/validation,
password hashing, and permission checking.
"""

import pytest
from datetime import datetime, timedelta

from app.core.security import (
    TokenData,
    check_permission,
    create_access_token,
    create_refresh_token,
    get_password_hash,
    is_password_strong,
    verify_password,
    verify_token,
)


class TestPasswordHashing:
    """Test password hashing and verification."""
    
    def test_password_hashing_and_verification(self) -> None:
        """Test password can be hashed and verified correctly."""
        password = "TestPassword123!"
        hashed = get_password_hash(password)
        
        # Hash should be different from original password
        assert hashed != password
        
        # Should verify correctly
        assert verify_password(password, hashed) is True
        
        # Should fail with wrong password
        assert verify_password("WrongPassword", hashed) is False
    
    def test_password_strength_validation(self) -> None:
        """Test password strength validation."""
        # Strong password
        is_strong, issues = is_password_strong("SecurePass123!")
        assert is_strong is True
        assert len(issues) == 0
        
        # Weak passwords
        weak_passwords = [
            "short",  # Too short
            "nouppercase123!",  # No uppercase
            "NOLOWERCASE123!",  # No lowercase
            "NoDigitsHere!",  # No digits
            "NoSpecialChars123",  # No special characters
        ]
        
        for weak_password in weak_passwords:
            is_strong, issues = is_password_strong(weak_password)
            assert is_strong is False
            assert len(issues) > 0


class TestJWTTokens:
    """Test JWT token creation and verification."""
    
    def test_access_token_creation_and_verification(self) -> None:
        """Test access token creation and verification."""
        user_id = "test-user-id"
        email = "test@example.com"
        roles = ["user", "moderator"]
        permissions = ["users:read", "content:create"]
        
        # Create token
        token = create_access_token(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions
        )
        
        assert isinstance(token, str)
        assert len(token) > 0
        
        # Verify token
        token_data = verify_token(token, "access")
        
        assert token_data is not None
        assert isinstance(token_data, TokenData)
        assert token_data.sub == user_id
        assert token_data.email == email
        assert token_data.roles == roles
        assert token_data.permissions == permissions
        assert token_data.token_type == "access"
    
    def test_refresh_token_creation_and_verification(self) -> None:
        """Test refresh token creation and verification."""
        user_id = "test-user-id"
        
        # Create refresh token
        token, token_id = create_refresh_token(user_id)
        
        assert isinstance(token, str)
        assert isinstance(token_id, str)
        assert len(token) > 0
        assert len(token_id) > 0
        
        # Verify token
        token_data = verify_token(token, "refresh")
        
        assert token_data is not None
        assert isinstance(token_data, TokenData)
        assert token_data.sub == user_id
        assert token_data.jti == token_id
        assert token_data.token_type == "refresh"
    
    def test_expired_token_verification(self) -> None:
        """Test that expired tokens are rejected."""
        user_id = "test-user-id"
        email = "test@example.com"
        roles = ["user"]
        permissions = ["users:read"]
        
        # Create token that expires immediately
        expired_delta = timedelta(seconds=-1)
        token = create_access_token(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions,
            expires_delta=expired_delta
        )
        
        # Verify token should return None for expired token
        token_data = verify_token(token, "access")
        assert token_data is None
    
    def test_invalid_token_verification(self) -> None:
        """Test that invalid tokens are rejected."""
        # Invalid token string
        token_data = verify_token("invalid-token", "access")
        assert token_data is None
        
        # Empty token
        token_data = verify_token("", "access")
        assert token_data is None
    
    def test_wrong_token_type_verification(self) -> None:
        """Test that tokens are rejected for wrong type."""
        user_id = "test-user-id"
        email = "test@example.com"
        roles = ["user"]
        permissions = ["users:read"]
        
        # Create access token
        access_token = create_access_token(
            user_id=user_id,
            email=email,
            roles=roles,
            permissions=permissions
        )
        
        # Try to verify as refresh token (should fail)
        token_data = verify_token(access_token, "refresh")
        assert token_data is None


class TestPermissionSystem:
    """Test permission checking functionality."""
    
    def test_permission_checking(self) -> None:
        """Test permission checking logic."""
        user_permissions = [
            "users:read",
            "users:create",
            "content:*",
            "admin:settings"
        ]
        
        # Should allow specific permissions
        assert check_permission(user_permissions, "users:read") is True
        assert check_permission(user_permissions, "users:create") is True
        assert check_permission(user_permissions, "admin:settings") is True
        
        # Should allow wildcard permissions
        assert check_permission(user_permissions, "content:read") is True
        assert check_permission(user_permissions, "content:create") is True
        assert check_permission(user_permissions, "content:delete") is True
        
        # Should deny missing permissions
        assert check_permission(user_permissions, "users:delete") is False
        assert check_permission(user_permissions, "admin:users") is False
    
    def test_superuser_permissions(self) -> None:
        """Test that superuser permission grants all access."""
        superuser_permissions = ["*:*"]
        
        # Should allow any permission
        assert check_permission(superuser_permissions, "users:read") is True
        assert check_permission(superuser_permissions, "admin:delete") is True
        assert check_permission(superuser_permissions, "anything:everything") is True
    
    def test_empty_permissions(self) -> None:
        """Test permission checking with empty permissions."""
        empty_permissions: list[str] = []
        
        # Should deny all permissions when user has none
        assert check_permission(empty_permissions, "users:read") is False
        assert check_permission(empty_permissions, "content:read") is False