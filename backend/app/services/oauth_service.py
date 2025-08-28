"""
OAuth Service

Handles OAuth authentication with various providers including
Google, GitHub, and Discord with proper type safety.
"""

import secrets
from datetime import datetime
from enum import Enum
from typing import Optional, Tuple

import httpx
import structlog
from authlib.integrations.starlette_client import OAuth, OAuthError
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.models.user import User
from app.schemas.auth import OAuthProvider, OAuthUserInfo
from app.services.auth_service import AuthService

settings = get_settings()
logger = structlog.get_logger(__name__)


class OAuthProviderType(Enum):
    """Supported OAuth providers."""
    GOOGLE = "google"
    GITHUB = "github"
    DISCORD = "discord"


class OAuthConfig:
    """OAuth provider configurations."""
    
    GOOGLE = {
        "client_id": getattr(settings, "GOOGLE_CLIENT_ID", ""),
        "client_secret": getattr(settings, "GOOGLE_CLIENT_SECRET", ""),
        "authorize_url": "https://accounts.google.com/o/oauth2/v2/auth",
        "access_token_url": "https://oauth2.googleapis.com/token",
        "api_base_url": "https://www.googleapis.com/",
        "client_kwargs": {
            "scope": "openid email profile"
        },
        "userinfo_endpoint": "https://openidconnect.googleapis.com/v1/userinfo",
    }
    
    GITHUB = {
        "client_id": getattr(settings, "GITHUB_CLIENT_ID", ""),
        "client_secret": getattr(settings, "GITHUB_CLIENT_SECRET", ""),
        "authorize_url": "https://github.com/login/oauth/authorize",
        "access_token_url": "https://github.com/login/oauth/access_token",
        "api_base_url": "https://api.github.com/",
        "client_kwargs": {
            "scope": "user:email"
        },
        "userinfo_endpoint": "https://api.github.com/user",
    }
    
    DISCORD = {
        "client_id": getattr(settings, "DISCORD_CLIENT_ID", ""),
        "client_secret": getattr(settings, "DISCORD_CLIENT_SECRET", ""),
        "authorize_url": "https://discord.com/api/oauth2/authorize",
        "access_token_url": "https://discord.com/api/oauth2/token",
        "api_base_url": "https://discord.com/api/",
        "client_kwargs": {
            "scope": "identify email"
        },
        "userinfo_endpoint": "https://discord.com/api/users/@me",
    }


class OAuthService:
    """
    Service for handling OAuth authentication flows.
    
    Provides methods for authenticating users via OAuth providers,
    linking OAuth accounts to existing users, and managing OAuth sessions.
    """
    
    def __init__(self, db: AsyncSession):
        """
        Initialize OAuth service.
        
        Args:
            db: Database session
        """
        self.db = db
        self.auth_service = AuthService(db)
        self.redirect_uri = f"{settings.FRONTEND_URL}/auth/callback"
        
        # Initialize OAuth client
        self.oauth = OAuth()
        self._register_providers()
    
    def _register_providers(self) -> None:
        """Register OAuth providers with authlib."""
        # Register Google
        if OAuthConfig.GOOGLE["client_id"]:
            self.oauth.register(
                name="google",
                server_metadata_url="https://accounts.google.com/.well-known/openid-configuration",
                client_id=OAuthConfig.GOOGLE["client_id"],
                client_secret=OAuthConfig.GOOGLE["client_secret"],
                client_kwargs=OAuthConfig.GOOGLE["client_kwargs"]
            )
        
        # Register GitHub
        if OAuthConfig.GITHUB["client_id"]:
            self.oauth.register(
                name="github",
                client_id=OAuthConfig.GITHUB["client_id"],
                client_secret=OAuthConfig.GITHUB["client_secret"],
                access_token_url=OAuthConfig.GITHUB["access_token_url"],
                authorize_url=OAuthConfig.GITHUB["authorize_url"],
                api_base_url=OAuthConfig.GITHUB["api_base_url"],
                client_kwargs=OAuthConfig.GITHUB["client_kwargs"]
            )
        
        # Register Discord
        if OAuthConfig.DISCORD["client_id"]:
            self.oauth.register(
                name="discord",
                client_id=OAuthConfig.DISCORD["client_id"],
                client_secret=OAuthConfig.DISCORD["client_secret"],
                access_token_url=OAuthConfig.DISCORD["access_token_url"],
                authorize_url=OAuthConfig.DISCORD["authorize_url"],
                api_base_url=OAuthConfig.DISCORD["api_base_url"],
                client_kwargs=OAuthConfig.DISCORD["client_kwargs"]
            )
    
    def get_authorization_url(self, provider: str, state: Optional[str] = None) -> str:
        """
        Get OAuth authorization URL for a provider.
        
        Args:
            provider: OAuth provider name
            state: Optional state parameter for CSRF protection
            
        Returns:
            str: Authorization URL
            
        Raises:
            HTTPException: If provider is not supported or configured
        """
        provider = provider.lower()
        
        if provider not in ["google", "github", "discord"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unsupported OAuth provider: {provider}"
            )
        
        # Check if provider is configured
        config = getattr(OAuthConfig, provider.upper())
        if not config["client_id"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth provider {provider} is not configured"
            )
        
        # Generate state if not provided
        if not state:
            state = secrets.token_urlsafe(32)
        
        # Build authorization URL
        client = getattr(self.oauth, provider)
        auth_url = client.authorize_redirect(
            redirect_uri=f"{self.redirect_uri}/{provider}",
            state=state
        )
        
        return auth_url.url
    
    async def authenticate_oauth_user(
        self,
        provider: str,
        code: str,
        state: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Tuple[User, str, str]:
        """
        Authenticate user via OAuth provider.
        
        Args:
            provider: OAuth provider name
            code: Authorization code from OAuth provider
            state: State parameter for CSRF protection
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Tuple of (User, access_token, refresh_token)
            
        Raises:
            HTTPException: If authentication fails
        """
        provider = provider.lower()
        
        try:
            # Exchange code for tokens
            user_info = await self._get_oauth_user_info(provider, code)
            
            # Find or create user
            user = await self._find_or_create_oauth_user(provider, user_info)
            
            # Generate tokens
            access_token = await self.auth_service.create_access_token(user)
            refresh_token = await self.auth_service.create_refresh_token(
                user,
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            # Log successful OAuth login
            await self.auth_service.log_audit_event(
                event_type="oauth_login",
                user_id=user.id,
                details={
                    "provider": provider,
                    "oauth_id": user_info.id
                },
                ip_address=ip_address,
                user_agent=user_agent
            )
            
            logger.info(
                "OAuth authentication successful",
                provider=provider,
                user_id=user.id,
                email=user.email
            )
            
            return user, access_token, refresh_token
            
        except OAuthError as e:
            logger.error(
                "OAuth authentication failed",
                provider=provider,
                error=str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"OAuth authentication failed: {str(e)}"
            )
        except Exception as e:
            logger.error(
                "Unexpected OAuth error",
                provider=provider,
                error=str(e)
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="OAuth authentication failed"
            )
    
    async def _get_oauth_user_info(self, provider: str, code: str) -> OAuthUserInfo:
        """
        Get user information from OAuth provider.
        
        Args:
            provider: OAuth provider name
            code: Authorization code
            
        Returns:
            OAuthUserInfo: User information from OAuth provider
        """
        config = getattr(OAuthConfig, provider.upper())
        
        async with httpx.AsyncClient() as client:
            # Exchange code for access token
            token_response = await client.post(
                config["access_token_url"],
                data={
                    "client_id": config["client_id"],
                    "client_secret": config["client_secret"],
                    "code": code,
                    "redirect_uri": f"{self.redirect_uri}/{provider}",
                    "grant_type": "authorization_code"
                },
                headers={"Accept": "application/json"}
            )
            
            if token_response.status_code != 200:
                raise OAuthError(f"Failed to exchange code for token: {token_response.text}")
            
            token_data = token_response.json()
            access_token = token_data.get("access_token")
            
            if not access_token:
                raise OAuthError("No access token in response")
            
            # Get user info
            userinfo_response = await client.get(
                config["userinfo_endpoint"],
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json"
                }
            )
            
            if userinfo_response.status_code != 200:
                raise OAuthError(f"Failed to get user info: {userinfo_response.text}")
            
            user_data = userinfo_response.json()
            
            # Parse user info based on provider
            if provider == "google":
                return OAuthUserInfo(
                    id=user_data["sub"],
                    email=user_data["email"],
                    name=user_data.get("name", ""),
                    picture=user_data.get("picture"),
                    email_verified=user_data.get("email_verified", False),
                    provider=OAuthProvider.GOOGLE
                )
            elif provider == "github":
                # GitHub may need additional API call for email
                email = user_data.get("email")
                if not email:
                    email_response = await client.get(
                        "https://api.github.com/user/emails",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Accept": "application/json"
                        }
                    )
                    if email_response.status_code == 200:
                        emails = email_response.json()
                        primary_email = next(
                            (e["email"] for e in emails if e.get("primary")),
                            None
                        )
                        email = primary_email
                
                return OAuthUserInfo(
                    id=str(user_data["id"]),
                    email=email or f"{user_data['login']}@users.noreply.github.com",
                    name=user_data.get("name") or user_data["login"],
                    picture=user_data.get("avatar_url"),
                    email_verified=True,  # GitHub requires email verification
                    provider=OAuthProvider.GITHUB
                )
            elif provider == "discord":
                return OAuthUserInfo(
                    id=user_data["id"],
                    email=user_data.get("email"),
                    name=user_data.get("username", ""),
                    picture=f"https://cdn.discordapp.com/avatars/{user_data['id']}/{user_data.get('avatar')}.png" if user_data.get("avatar") else None,
                    email_verified=user_data.get("verified", False),
                    provider=OAuthProvider.DISCORD
                )
            else:
                raise OAuthError(f"Unknown provider: {provider}")
    
    async def _find_or_create_oauth_user(
        self,
        provider: str,
        user_info: OAuthUserInfo
    ) -> User:
        """
        Find existing user or create new one from OAuth info.
        
        Args:
            provider: OAuth provider name
            user_info: User information from OAuth provider
            
        Returns:
            User: Existing or newly created user
        """
        # First try to find user by OAuth provider ID
        oauth_field = f"{provider}_id"
        query = select(User).where(
            getattr(User, oauth_field) == user_info.id
        )
        result = await self.db.execute(query)
        user = result.scalar_one_or_none()
        
        if user:
            # Update user info if needed
            if user_info.picture and not user.avatar_url:
                user.avatar_url = user_info.picture
            if user_info.name and not user.full_name:
                user.full_name = user_info.name
            
            await self.db.commit()
            return user
        
        # Try to find user by email
        if user_info.email:
            query = select(User).where(User.email == user_info.email)
            result = await self.db.execute(query)
            user = result.scalar_one_or_none()
            
            if user:
                # Link OAuth account to existing user
                setattr(user, oauth_field, user_info.id)
                if user_info.picture and not user.avatar_url:
                    user.avatar_url = user_info.picture
                if user_info.name and not user.full_name:
                    user.full_name = user_info.name
                
                # Auto-verify email if OAuth provider verified it
                if user_info.email_verified and not user.email_verified:
                    user.email_verified = True
                    user.email_verified_at = datetime.utcnow()
                
                await self.db.commit()
                return user
        
        # Create new user
        user = User(
            email=user_info.email or f"{user_info.id}@{provider}.oauth",
            username=user_info.email.split("@")[0] if user_info.email else f"{provider}_{user_info.id}",
            full_name=user_info.name,
            avatar_url=user_info.picture,
            email_verified=user_info.email_verified,
            email_verified_at=datetime.utcnow() if user_info.email_verified else None,
            is_active=True,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        # Set OAuth provider ID
        setattr(user, oauth_field, user_info.id)
        
        # Set a random password for OAuth users
        user.hashed_password = secrets.token_urlsafe(32)
        
        self.db.add(user)
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            "Created new user from OAuth",
            provider=provider,
            user_id=user.id,
            email=user.email
        )
        
        return user
    
    async def link_oauth_account(
        self,
        user: User,
        provider: str,
        oauth_user_info: OAuthUserInfo
    ) -> User:
        """
        Link an OAuth account to an existing user.
        
        Args:
            user: Existing user
            provider: OAuth provider name
            oauth_user_info: OAuth user information
            
        Returns:
            User: Updated user with linked OAuth account
            
        Raises:
            HTTPException: If OAuth account is already linked to another user
        """
        oauth_field = f"{provider}_id"
        
        # Check if OAuth account is already linked to another user
        query = select(User).where(
            getattr(User, oauth_field) == oauth_user_info.id,
            User.id != user.id
        )
        result = await self.db.execute(query)
        existing_user = result.scalar_one_or_none()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"This {provider} account is already linked to another user"
            )
        
        # Link OAuth account
        setattr(user, oauth_field, oauth_user_info.id)
        
        # Update user info if not already set
        if oauth_user_info.picture and not user.avatar_url:
            user.avatar_url = oauth_user_info.picture
        if oauth_user_info.name and not user.full_name:
            user.full_name = oauth_user_info.name
        
        user.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            "Linked OAuth account to user",
            provider=provider,
            user_id=user.id,
            oauth_id=oauth_user_info.id
        )
        
        return user
    
    async def unlink_oauth_account(
        self,
        user: User,
        provider: str
    ) -> User:
        """
        Unlink an OAuth account from a user.
        
        Args:
            user: User to unlink OAuth account from
            provider: OAuth provider name
            
        Returns:
            User: Updated user with unlinked OAuth account
            
        Raises:
            HTTPException: If user has no password and this is their only auth method
        """
        oauth_field = f"{provider}_id"
        
        # Check if user has a password or other OAuth accounts
        has_password = bool(user.hashed_password and user.hashed_password != "")
        oauth_providers = ["google_id", "github_id", "discord_id"]
        other_oauth = any(
            getattr(user, field) for field in oauth_providers 
            if field != oauth_field
        )
        
        if not has_password and not other_oauth:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot unlink the only authentication method. Please set a password first."
            )
        
        # Unlink OAuth account
        setattr(user, oauth_field, None)
        user.updated_at = datetime.utcnow()
        
        await self.db.commit()
        await self.db.refresh(user)
        
        logger.info(
            "Unlinked OAuth account from user",
            provider=provider,
            user_id=user.id
        )
        
        return user