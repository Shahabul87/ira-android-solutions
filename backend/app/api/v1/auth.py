"""
Authentication Endpoints

Handles user authentication including login, registration,
token refresh, password reset, and OAuth flows.
"""

from typing import Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.services.auth_service import (
    AccountLockedError,
    AuthService,
    AuthenticationError,
    EmailNotVerifiedError,
)
from app.schemas.auth import (
    EmailVerificationRequest,
    LoginRequest,
    LoginResponse,
    MessageResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    RegisterRequest,
    TokenRefreshRequest,
    TokenRefreshResponse,
    UserResponse,
)

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(
    user_data: RegisterRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> UserResponse:
    """
    Register a new user account.
    
    Creates a new user account with email verification.
    Sends verification email if email service is configured.
    
    Args:
        user_data: User registration data
        request: FastAPI request object
        db: Database session
        
    Returns:
        UserResponse: Created user information
        
    Raises:
        HTTPException: If email already exists or validation fails
    """
    logger.info("User registration attempt", email=user_data.email)
    
    try:
        auth_service = AuthService(db)
        
        # Get client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        user_response = await auth_service.register_user(
            registration_data=user_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(
            "User registration successful",
            user_id=user_response.id,
            email=user_response.email
        )
        
        return user_response
        
    except ValueError as e:
        logger.warning(
            "User registration validation failed",
            email=user_data.email,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthenticationError as e:
        logger.error(
            "User registration failed",
            email=user_data.email,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=LoginResponse)
async def login(
    credentials: LoginRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> LoginResponse:
    """
    Authenticate user and return tokens.
    
    Validates user credentials and returns JWT access and refresh tokens.
    Implements rate limiting and account lockout for security.
    
    Args:
        credentials: User login credentials
        request: FastAPI request object
        db: Database session
        
    Returns:
        LoginResponse: JWT tokens and user information
        
    Raises:
        HTTPException: If credentials are invalid or account is locked
    """
    logger.info("User login attempt", email=credentials.email)
    
    try:
        auth_service = AuthService(db)
        
        # Get client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        login_response = await auth_service.authenticate_user(
            email=credentials.email,
            password=credentials.password,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(
            "User login successful",
            user_id=login_response.user.id,
            email=login_response.user.email
        )
        
        return login_response
        
    except AccountLockedError as e:
        logger.warning(
            "Login attempt on locked account",
            email=credentials.email,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_423_LOCKED,
            detail=str(e)
        )
    except EmailNotVerifiedError as e:
        logger.warning(
            "Login attempt with unverified email",
            email=credentials.email,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except AuthenticationError as e:
        logger.warning(
            "User login failed",
            email=credentials.email,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    token_data: TokenRefreshRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> TokenRefreshResponse:
    """
    Refresh access token using refresh token.
    
    Validates refresh token and issues new access token.
    Implements token rotation for enhanced security.
    
    Args:
        token_data: Refresh token request data
        request: FastAPI request object
        db: Database session
        
    Returns:
        TokenRefreshResponse: New access token information
        
    Raises:
        HTTPException: If refresh token is invalid or expired
    """
    try:
        auth_service = AuthService(db)
        
        # Get client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        token_response = await auth_service.refresh_access_token(
            refresh_token=token_data.refresh_token,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.debug("Access token refreshed successfully")
        
        return TokenRefreshResponse(
            access_token=str(token_response["access_token"]),
            token_type=str(token_response["token_type"]),
            expires_in=int(token_response["expires_in"])
        )
        
    except AuthenticationError as e:
        logger.warning(
            "Token refresh failed",
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )


@router.post("/logout", response_model=MessageResponse)
async def logout(
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Logout user and invalidate tokens.
    
    Adds tokens to blacklist and performs cleanup.
    
    Args:
        request: FastAPI request object
        db: Database session
        
    Returns:
        MessageResponse: Success message
    """
    try:
        auth_service = AuthService(db)
        
        # Extract token from Authorization header or cookies
        auth_header = request.headers.get("authorization")
        access_token: Optional[str] = None
        
        if auth_header and auth_header.startswith("Bearer "):
            access_token = auth_header[7:]
        else:
            # Try to get from cookies
            access_token = request.cookies.get("access_token")
        
        if access_token:
            # Invalidate the token
            await auth_service.logout_user(access_token)
            
            logger.info("User logged out successfully")
        else:
            logger.warning("Logout attempted without token")
        
        return MessageResponse(message="Successfully logged out")
        
    except Exception as e:
        logger.error("Logout failed", error=str(e))
        # Always return success for security reasons
        return MessageResponse(message="Successfully logged out")


@router.post("/forgot-password", response_model=MessageResponse)
async def forgot_password(
    reset_request: PasswordResetRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Send password reset email.
    
    Generates secure reset token and sends email with reset link.
    
    Args:
        reset_request: Password reset request data
        request: FastAPI request object
        db: Database session
        
    Returns:
        MessageResponse: Success message (always returns success for security)
    """
    logger.info("Password reset requested", email=reset_request.email)
    
    try:
        auth_service = AuthService(db)
        
        # Get client information for audit
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Request password reset (handles token generation and email sending)
        await auth_service.request_password_reset(
            email=reset_request.email,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
    except Exception as e:
        # Log the error but don't expose it to the user
        logger.error(
            "Password reset request failed",
            email=reset_request.email,
            error=str(e)
        )
    
    # Always return the same message for security
    return MessageResponse(
        message="If an account with that email exists, a password reset link has been sent."
    )


@router.post("/reset-password", response_model=MessageResponse)
async def reset_password(
    reset_data: PasswordResetConfirm,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Reset password using reset token.
    
    Validates reset token and updates user password.
    
    Args:
        reset_data: Password reset confirmation data
        request: FastAPI request object
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        auth_service = AuthService(db)
        
        # Get client information for audit
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Reset password using the token
        await auth_service.reset_password(
            reset_token=reset_data.token,
            new_password=reset_data.new_password,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info("Password reset successful", token=reset_data.token[:8] + "...")
        
        return MessageResponse(message="Password has been reset successfully")
        
    except ValueError as e:
        logger.warning(
            "Password reset validation failed",
            token=reset_data.token[:8] + "...",
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except AuthenticationError as e:
        logger.error(
            "Password reset failed",
            token=reset_data.token[:8] + "...",
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )


@router.get("/verify-email/{token}", response_model=MessageResponse)
async def verify_email(
    token: str,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Verify user email address.
    
    Validates email verification token and activates account.
    
    Args:
        token: Email verification token
        request: FastAPI request object
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        auth_service = AuthService(db)
        
        # Get client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        await auth_service.verify_email(
            verification_token=token,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info("Email verified successfully", token=token[:8] + "...")
        
        return MessageResponse(message="Email verified successfully")
        
    except ValueError as e:
        logger.warning(
            "Email verification failed",
            token=token[:8] + "...",
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/resend-verification", response_model=MessageResponse)
async def resend_verification(
    verification_request: EmailVerificationRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Resend email verification.
    
    Generates new verification token and sends email.
    
    Args:
        verification_request: Email verification request data
        request: FastAPI request object
        db: Database session
        
    Returns:
        MessageResponse: Success message
    """
    logger.info("Email verification resend requested", email=verification_request.email)
    
    try:
        auth_service = AuthService(db)
        
        # Get client information for audit
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Resend verification email
        await auth_service.resend_verification_email(
            email=verification_request.email,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
    except Exception as e:
        # Log the error but don't expose it to the user
        logger.error(
            "Verification email resend failed",
            email=verification_request.email,
            error=str(e)
        )
    
    # Always return success for security reasons
    return MessageResponse(message="If an account with that email exists, a verification email has been sent.")


# OAuth endpoints will be implemented in separate modules
# Examples: /auth/oauth/google, /auth/oauth/github, etc.