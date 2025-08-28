"""
Authentication Schemas

Pydantic models for authentication-related API requests and responses.
"""

from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
import re


class LoginRequest(BaseModel):
    """User login credentials."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")
    remember_me: bool = Field(False, description="Keep user logged in for extended period")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!",
                "remember_me": False
            }
        }


class RegisterRequest(BaseModel):
    """User registration data."""
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    confirm_password: str = Field(..., description="Password confirmation")
    first_name: str = Field(..., min_length=2, max_length=50, description="First name")
    last_name: str = Field(..., min_length=2, max_length=50, description="Last name")
    agree_to_terms: bool = Field(..., description="Agreement to terms and conditions")
    
    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches password."""
        if hasattr(info, 'data') and info.data and 'password' in info.data:
            if v != info.data['password']:
                raise ValueError('Passwords do not match')
        return v
    
    @field_validator('agree_to_terms')
    @classmethod
    def validate_terms_agreement(cls, v: bool) -> bool:
        """Validate user agreed to terms."""
        if not v:
            raise ValueError('You must agree to the terms and conditions')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "newuser@example.com",
                "password": "SecurePassword123!",
                "confirm_password": "SecurePassword123!",
                "first_name": "John",
                "last_name": "Doe",
                "agree_to_terms": True
            }
        }


class UserResponse(BaseModel):
    """User information response."""
    
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email address")
    first_name: str = Field(..., description="First name")
    last_name: str = Field(..., description="Last name")
    is_active: bool = Field(..., description="Whether user account is active")
    is_verified: bool = Field(..., description="Whether email is verified")
    roles: list[str] = Field(..., description="User roles")
    created_at: Optional[str] = Field(None, description="Account creation timestamp")
    last_login: Optional[str] = Field(None, description="Last login timestamp")
    
    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "first_name": "John",
                "last_name": "Doe",
                "is_active": True,
                "is_verified": True,
                "roles": ["user"],
                "created_at": "2024-01-01T00:00:00Z",
                "last_login": "2024-01-01T12:00:00Z"
            }
        }


class LoginResponse(BaseModel):
    """Successful login response with tokens."""
    
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    user: UserResponse = Field(..., description="User information")
    requires_2fa: bool = Field(False, description="Whether 2FA verification is required")
    temp_token: Optional[str] = Field(None, description="Temporary token for 2FA verification")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 900,
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "is_active": True,
                    "is_verified": True,
                    "roles": ["user"]
                }
            }
        }


class TokenRefreshRequest(BaseModel):
    """Token refresh request."""
    
    refresh_token: str = Field(..., description="Valid refresh token")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            }
        }


class TokenRefreshResponse(BaseModel):
    """Token refresh response."""
    
    access_token: str = Field(..., description="New JWT access token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Access token expiration in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "expires_in": 900
            }
        }


class PasswordResetRequest(BaseModel):
    """Password reset request."""
    
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class PasswordResetConfirm(BaseModel):
    """Password reset confirmation."""
    
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    confirm_password: str = Field(..., description="Password confirmation")
    
    @field_validator('new_password')
    @classmethod
    def validate_password_strength(cls, v: str) -> str:
        """Validate password meets security requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', v):
            raise ValueError('Password must contain at least one special character')
        
        return v
    
    @field_validator('confirm_password')
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        """Validate password confirmation matches password."""
        if hasattr(info, 'data') and info.data and 'new_password' in info.data:
            if v != info.data['new_password']:
                raise ValueError('Passwords do not match')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "token": "reset-token-here",
                "new_password": "NewSecurePassword123!",
                "confirm_password": "NewSecurePassword123!"
            }
        }


class EmailVerificationRequest(BaseModel):
    """Email verification resend request."""
    
    email: EmailStr = Field(..., description="User email address")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class MessageResponse(BaseModel):
    """Generic message response."""
    
    message: str = Field(..., description="Response message")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully"
            }
        }


class OAuthProvider(str, Enum):
    """Supported OAuth providers."""
    GOOGLE = "google"
    GITHUB = "github"  
    DISCORD = "discord"


class OAuthUserInfo(BaseModel):
    """OAuth user information from provider."""
    
    id: str = Field(..., description="OAuth provider user ID")
    email: Optional[str] = Field(None, description="User email from OAuth provider")
    name: Optional[str] = Field(None, description="User full name from OAuth provider")
    picture: Optional[str] = Field(None, description="User avatar URL from OAuth provider")
    email_verified: bool = Field(False, description="Whether email is verified by OAuth provider")
    provider: OAuthProvider = Field(..., description="OAuth provider type")


class OAuthCallbackRequest(BaseModel):
    """OAuth callback request."""
    
    code: str = Field(..., description="Authorization code from OAuth provider")
    state: Optional[str] = Field(None, description="State parameter for CSRF protection")
    
    class Config:
        json_schema_extra = {
            "example": {
                "code": "authorization-code-from-provider",
                "state": "random-state-string"
            }
        }


class OAuthInitResponse(BaseModel):
    """OAuth initialization response."""
    
    authorization_url: str = Field(..., description="URL to redirect user for OAuth authorization")
    state: str = Field(..., description="State parameter for CSRF protection")
    
    class Config:
        json_schema_extra = {
            "example": {
                "authorization_url": "https://accounts.google.com/o/oauth2/v2/auth?...",
                "state": "random-state-string"
            }
        }


class TwoFactorLoginRequest(BaseModel):
    """Two-factor login verification request."""
    
    temp_token: str = Field(..., description="Temporary token from initial login")
    code: str = Field(..., min_length=6, max_length=8, description="2FA code (TOTP or backup)")
    is_backup: bool = Field(False, description="Whether the code is a backup code")
    
    class Config:
        json_schema_extra = {
            "example": {
                "temp_token": "temporary-token-from-login",
                "code": "123456",
                "is_backup": False
            }
        }