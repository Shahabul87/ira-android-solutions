"""
OAuth Authentication Endpoints

Handles OAuth authentication flows for various providers including
Google, GitHub, and Discord.
"""

from typing import Dict

import structlog
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user_optional
from app.models.user import User
from app.schemas.auth import (
    LoginResponse,
    OAuthCallbackRequest,
    OAuthInitResponse,
    OAuthProvider,
    MessageResponse,
    UserResponse
)
from app.services.oauth_service import OAuthService

logger = structlog.get_logger(__name__)

router = APIRouter()


@router.get("/oauth/{provider}/init", response_model=OAuthInitResponse)
async def oauth_init(
    provider: OAuthProvider,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> OAuthInitResponse:
    """
    Initialize OAuth authentication flow.
    
    Generates and returns the authorization URL for the specified OAuth provider.
    
    Args:
        provider: OAuth provider (google, github, discord)
        request: FastAPI request object
        db: Database session
        
    Returns:
        OAuthInitResponse: Authorization URL and state parameter
        
    Raises:
        HTTPException: If provider is not supported or configured
    """
    logger.info("OAuth initialization requested", provider=provider.value)
    
    try:
        oauth_service = OAuthService(db)
        
        # Generate state for CSRF protection
        import secrets
        state = secrets.token_urlsafe(32)
        
        # Store state in session or cache for verification
        # In production, use Redis or session storage
        request.session = request.session or {}
        request.session[f"oauth_state_{provider.value}"] = state
        
        # Get authorization URL
        auth_url = oauth_service.get_authorization_url(provider.value, state)
        
        logger.info(
            "OAuth initialization successful",
            provider=provider.value
        )
        
        return OAuthInitResponse(
            authorization_url=auth_url,
            state=state
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "OAuth initialization failed",
            provider=provider.value,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to initialize OAuth flow"
        )


@router.post("/oauth/{provider}/callback", response_model=LoginResponse)
async def oauth_callback(
    provider: OAuthProvider,
    callback_data: OAuthCallbackRequest,
    request: Request,
    db: AsyncSession = Depends(get_db_session)
) -> LoginResponse:
    """
    Handle OAuth callback from provider.
    
    Exchanges authorization code for tokens and authenticates the user.
    
    Args:
        provider: OAuth provider (google, github, discord)
        callback_data: Authorization code and state from provider
        request: FastAPI request object
        db: Database session
        
    Returns:
        LoginResponse: Access and refresh tokens
        
    Raises:
        HTTPException: If authentication fails or state is invalid
    """
    logger.info(
        "OAuth callback received",
        provider=provider.value,
        has_code=bool(callback_data.code),
        has_state=bool(callback_data.state)
    )
    
    try:
        # Verify state for CSRF protection
        if callback_data.state:
            stored_state = getattr(request.session, f"oauth_state_{provider.value}", None)
            if stored_state != callback_data.state:
                logger.warning(
                    "OAuth state mismatch",
                    provider=provider.value
                )
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid state parameter"
                )
        
        oauth_service = OAuthService(db)
        
        # Get client information
        ip_address = request.client.host if request.client else None
        user_agent = request.headers.get("user-agent")
        
        # Authenticate user
        user, access_token, refresh_token = await oauth_service.authenticate_oauth_user(
            provider=provider.value,
            code=callback_data.code,
            state=callback_data.state,
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        logger.info(
            "OAuth authentication successful",
            provider=provider.value,
            user_id=user.id,
            email=user.email
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=900,  # 15 minutes
            user=UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                roles=[role.name for role in user.roles]
            )
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "OAuth callback failed",
            provider=provider.value,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed"
        )


@router.post("/oauth/{provider}/link", response_model=MessageResponse)
async def link_oauth_account(
    provider: OAuthProvider,
    callback_data: OAuthCallbackRequest,
    request: Request,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Link an OAuth account to existing user.
    
    Allows authenticated users to link additional OAuth providers
    to their existing account.
    
    Args:
        provider: OAuth provider to link
        callback_data: Authorization code from provider
        request: FastAPI request object
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If user is not authenticated or linking fails
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to link OAuth account"
        )
    
    logger.info(
        "OAuth account linking requested",
        provider=provider.value,
        user_id=current_user.id
    )
    
    try:
        oauth_service = OAuthService(db)
        
        # Get OAuth user info
        oauth_user_info = await oauth_service._get_oauth_user_info(
            provider.value,
            callback_data.code
        )
        
        # Link OAuth account
        await oauth_service.link_oauth_account(
            user=current_user,
            provider=provider.value,
            oauth_user_info=oauth_user_info
        )
        
        logger.info(
            "OAuth account linked successfully",
            provider=provider.value,
            user_id=current_user.id
        )
        
        return MessageResponse(
            message=f"{provider.value.title()} account linked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "OAuth account linking failed",
            provider=provider.value,
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to link OAuth account"
        )


@router.delete("/oauth/{provider}/unlink", response_model=MessageResponse)
async def unlink_oauth_account(
    provider: OAuthProvider,
    current_user: User = Depends(get_current_user_optional),
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Unlink an OAuth account from user.
    
    Removes the connection between a user account and an OAuth provider.
    
    Args:
        provider: OAuth provider to unlink
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If user is not authenticated or unlinking fails
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required to unlink OAuth account"
        )
    
    logger.info(
        "OAuth account unlinking requested",
        provider=provider.value,
        user_id=current_user.id
    )
    
    try:
        oauth_service = OAuthService(db)
        
        # Unlink OAuth account
        await oauth_service.unlink_oauth_account(
            user=current_user,
            provider=provider.value
        )
        
        logger.info(
            "OAuth account unlinked successfully",
            provider=provider.value,
            user_id=current_user.id
        )
        
        return MessageResponse(
            message=f"{provider.value.title()} account unlinked successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            "OAuth account unlinking failed",
            provider=provider.value,
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unlink OAuth account"
        )


@router.get("/oauth/providers", response_model=Dict[str, bool])
async def get_oauth_providers() -> Dict[str, bool]:
    """
    Get list of configured OAuth providers.
    
    Returns a dictionary indicating which OAuth providers are configured
    and available for use.
    
    Returns:
        Dict[str, bool]: Provider availability status
    """
    from app.services.oauth_service import OAuthConfig
    
    return {
        "google": bool(OAuthConfig.GOOGLE["client_id"]),
        "github": bool(OAuthConfig.GITHUB["client_id"]),
        "discord": bool(OAuthConfig.DISCORD["client_id"])
    }