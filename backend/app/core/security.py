"""
Core Security Utilities

Provides JWT token generation/validation, password hashing,
and other security-related utilities with strict type safety.
"""

import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Union

import structlog
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class TokenData:
    """Type-safe token data structure."""
    
    def __init__(
        self,
        sub: str,
        email: str,
        roles: List[str],
        permissions: List[str],
        token_type: str,
        exp: int,
        iat: int,
        jti: Optional[str] = None
    ) -> None:
        self.sub = sub
        self.email = email
        self.roles = roles
        self.permissions = permissions
        self.token_type = token_type
        self.exp = exp
        self.iat = iat
        self.jti = jti


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        bool: True if password matches, False otherwise
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error("Password verification failed", error=str(e))
        return False


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def generate_token_id() -> str:
    """
    Generate a unique token identifier.
    
    Returns:
        str: Unique token ID
    """
    return secrets.token_urlsafe(32)


def create_access_token(
    user_id: str,
    email: str,
    roles: List[str],
    permissions: List[str],
    expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        user_id: User ID
        email: User email
        roles: List of user roles
        permissions: List of user permissions
        expires_delta: Custom expiration time
        
    Returns:
        str: JWT access token
        
    Raises:
        ValueError: If token creation fails
    """
    try:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        now = datetime.utcnow()
        
        to_encode: Dict[str, Union[str, int, List[str]]] = {
            "sub": user_id,
            "email": email,
            "roles": roles,
            "permissions": permissions,
            "type": "access",
            "exp": int(expire.timestamp()),
            "iat": int(now.timestamp()),
        }
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        logger.debug(
            "Access token created",
            user_id=user_id,
            email=email,
            expires_at=expire.isoformat(),
            roles_count=len(roles),
            permissions_count=len(permissions)
        )
        
        return encoded_jwt
        
    except Exception as e:
        logger.error("Failed to create access token", error=str(e), user_id=user_id)
        raise ValueError(f"Failed to create access token: {str(e)}")


def create_refresh_token(user_id: str, expires_delta: Optional[timedelta] = None) -> tuple[str, str]:
    """
    Create a JWT refresh token with unique token ID.
    
    Args:
        user_id: User ID
        expires_delta: Custom expiration time
        
    Returns:
        tuple: (JWT refresh token, token ID)
        
    Raises:
        ValueError: If token creation fails
    """
    try:
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        now = datetime.utcnow()
        token_id = generate_token_id()
        
        to_encode: Dict[str, Union[str, int]] = {
            "sub": user_id,
            "type": "refresh",
            "jti": token_id,
            "exp": int(expire.timestamp()),
            "iat": int(now.timestamp()),
        }
        
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
        
        logger.debug(
            "Refresh token created",
            user_id=user_id,
            token_id=token_id,
            expires_at=expire.isoformat()
        )
        
        return encoded_jwt, token_id
        
    except Exception as e:
        logger.error("Failed to create refresh token", error=str(e), user_id=user_id)
        raise ValueError(f"Failed to create refresh token: {str(e)}")


def verify_token(token: str, expected_type: str = "access") -> Optional[TokenData]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        expected_type: Expected token type ('access' or 'refresh')
        
    Returns:
        Optional[TokenData]: Token data if valid, None otherwise
    """
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Extract required fields with type checking
        sub: Optional[str] = payload.get("sub")
        token_type: Optional[str] = payload.get("type")
        exp: Optional[int] = payload.get("exp")
        iat: Optional[int] = payload.get("iat")
        
        if not sub or not token_type or exp is None or iat is None:
            logger.warning("Token missing required fields", payload_keys=list(payload.keys()))
            return None
        
        if token_type != expected_type:
            logger.warning(
                "Token type mismatch",
                expected=expected_type,
                actual=token_type,
                user_id=sub
            )
            return None
        
        # Check expiration
        if datetime.utcnow().timestamp() > exp:
            logger.debug("Token expired", user_id=sub, exp=exp)
            return None
        
        # Extract optional fields based on token type
        if expected_type == "access":
            email: str = payload.get("email", "")
            roles: List[str] = payload.get("roles", [])
            permissions: List[str] = payload.get("permissions", [])
            
            if not email:
                logger.warning("Access token missing email", user_id=sub)
                return None
            
            return TokenData(
                sub=sub,
                email=email,
                roles=roles,
                permissions=permissions,
                token_type=token_type,
                exp=exp,
                iat=iat
            )
        
        elif expected_type == "refresh":
            jti: Optional[str] = payload.get("jti")
            
            if not jti:
                logger.warning("Refresh token missing jti", user_id=sub)
                return None
            
            return TokenData(
                sub=sub,
                email="",  # Refresh tokens don't contain email
                roles=[],
                permissions=[],
                token_type=token_type,
                exp=exp,
                iat=iat,
                jti=jti
            )
        
        return None
        
    except JWTError as e:
        logger.warning("JWT verification failed", error=str(e))
        return None
    except Exception as e:
        logger.error("Token verification error", error=str(e))
        return None


def generate_reset_token() -> str:
    """
    Generate a secure password reset token.
    
    Returns:
        str: Secure random token
    """
    return secrets.token_urlsafe(32)


def generate_verification_token() -> str:
    """
    Generate a secure email verification token.
    
    Returns:
        str: Secure random token
    """
    return secrets.token_urlsafe(32)


def is_password_strong(password: str) -> tuple[bool, List[str]]:
    """
    Check if a password meets security requirements.
    
    Args:
        password: Password to check
        
    Returns:
        tuple: (is_strong, list_of_issues)
    """
    issues: List[str] = []
    
    if len(password) < 8:
        issues.append("Password must be at least 8 characters long")
    
    if not any(c.isupper() for c in password):
        issues.append("Password must contain at least one uppercase letter")
    
    if not any(c.islower() for c in password):
        issues.append("Password must contain at least one lowercase letter")
    
    if not any(c.isdigit() for c in password):
        issues.append("Password must contain at least one digit")
    
    special_chars = "!@#$%^&*(),.?\":{}|<>"
    if not any(c in special_chars for c in password):
        issues.append("Password must contain at least one special character")
    
    return len(issues) == 0, issues


def check_permission(user_permissions: List[str], required_permission: str) -> bool:
    """
    Check if user has a specific permission.
    
    Args:
        user_permissions: List of user permissions
        required_permission: Required permission in 'resource:action' format
        
    Returns:
        bool: True if user has permission, False otherwise
    """
    # Check for super admin permission
    if "*:*" in user_permissions:
        return True
    
    # Check for specific permission
    if required_permission in user_permissions:
        return True
    
    # Check for wildcard resource permissions
    resource, action = required_permission.split(":", 1)
    resource_wildcard = f"{resource}:*"
    if resource_wildcard in user_permissions:
        return True
    
    return False


def has_role(user_roles: List[str], required_role: str) -> bool:
    """
    Check if user has a specific role.
    
    Args:
        user_roles: List of user roles
        required_role: Required role name
        
    Returns:
        bool: True if user has role, False otherwise
    """
    return required_role in user_roles