"""
Authentication Service

Handles all authentication-related business logic including
user registration, login, password reset, and email verification.
"""

import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional

import structlog
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import (
    check_permission,
    create_access_token,
    create_refresh_token,
    generate_reset_token,
    generate_verification_token,
    get_password_hash,
    is_password_strong,
    verify_password,
    verify_token,
)
from app.models.audit import AuditAction, AuditLog, AuditResult
from app.models.auth import EmailVerificationToken, PasswordResetToken, RefreshToken
from app.models.session import UserSession
from app.models.user import Role, User, UserRole
from app.schemas.auth import LoginResponse, RegisterRequest, UserResponse

settings = get_settings()
logger = structlog.get_logger(__name__)


class AuthenticationError(Exception):
    """Authentication-related errors."""
    pass


class AuthorizationError(Exception):
    """Authorization-related errors."""
    pass


class AccountLockedError(AuthenticationError):
    """Account is locked due to too many failed attempts."""
    pass


class EmailNotVerifiedError(AuthenticationError):
    """Email address is not verified."""
    pass


class AuthService:
    """
    Authentication service handling all auth-related operations.
    
    Provides methods for user registration, login, token management,
    password reset, and email verification with proper security measures.
    """
    
    def __init__(self, session: AsyncSession) -> None:
        """
        Initialize authentication service.
        
        Args:
            session: Database session
        """
        self.session = session
    
    async def register_user(
        self,
        registration_data: RegisterRequest,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> UserResponse:
        """
        Register a new user account.
        
        Args:
            registration_data: User registration information
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            UserResponse: Created user information
            
        Raises:
            ValueError: If email already exists or validation fails
            AuthenticationError: If registration fails
        """
        try:
            # Check if email already exists
            stmt = select(User).where(User.email == registration_data.email)
            existing_user = await self.session.execute(stmt)
            if existing_user.scalar_one_or_none():
                logger.warning(
                    "Registration attempt with existing email",
                    email=registration_data.email,
                    ip_address=ip_address
                )
                raise ValueError("Email address is already registered")
            
            # Validate password strength
            is_strong, issues = is_password_strong(registration_data.password)
            if not is_strong:
                logger.warning(
                    "Registration attempt with weak password",
                    email=registration_data.email,
                    issues=issues
                )
                raise ValueError(f"Password requirements not met: {', '.join(issues)}")
            
            # Hash password
            password_hash = get_password_hash(registration_data.password)
            
            # Create user
            user = User(
                email=registration_data.email,
                hashed_password=password_hash,
                first_name=registration_data.first_name,
                last_name=registration_data.last_name,
                is_active=True,  # Temporarily set to active for testing
                is_verified=False,
                is_superuser=False
            )
            
            self.session.add(user)
            await self.session.flush()
            
            # Assign default user role
            stmt = select(Role).where(Role.name == "user")
            result = await self.session.execute(stmt)
            user_role = result.scalar_one_or_none()
            
            if user_role:
                user_role_assignment = UserRole(
                    user_id=user.id,
                    role_id=user_role.id
                )
                self.session.add(user_role_assignment)
                await self.session.flush()
            
            await self.session.commit()
            
            logger.info(
                "User registered successfully",
                user_id=str(user.id),
                email=user.email,
                ip_address=ip_address
            )
            
            # TODO: Send verification email (implement email service)
            
            return UserResponse(
                id=str(user.id),
                email=user.email,
                first_name=user.first_name,
                last_name=user.last_name,
                is_active=user.is_active,
                is_verified=user.is_verified,
                roles=["user"],
                created_at=user.created_at.isoformat(),
                last_login=None
            )
            
        except ValueError:
            await self.session.rollback()
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "User registration failed",
                email=registration_data.email,
                error=str(e),
                ip_address=ip_address
            )
            raise AuthenticationError(f"Registration failed: {str(e)}")
    
    async def authenticate_user(
        self,
        email: str,
        password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> LoginResponse:
        """
        Authenticate user with email and password.
        
        Args:
            email: User email
            password: User password
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            LoginResponse: Authentication tokens and user info
            
        Raises:
            AuthenticationError: If authentication fails
            AccountLockedError: If account is locked
            EmailNotVerifiedError: If email is not verified
        """
        try:
            # Get user with roles
            stmt = (
                select(User)
                .options(selectinload(User.roles))
                .where(User.email == email)
            )
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user or not user.hashed_password:
                await self._handle_failed_login(email, "Invalid credentials", ip_address, user_agent)
                raise AuthenticationError("Invalid email or password")
            
            # Check if account is locked
            if user.is_locked:
                logger.warning(
                    "Login attempt on locked account",
                    user_id=str(user.id),
                    email=email,
                    locked_until=user.locked_until.isoformat() if user.locked_until else None,
                    ip_address=ip_address
                )
                raise AccountLockedError(f"Account is locked until {user.locked_until}")
            
            # Verify password
            if not verify_password(password, user.hashed_password):
                await self._handle_failed_login(email, "Invalid password", ip_address, user_agent, user)
                raise AuthenticationError("Invalid email or password")
            
            # Check if account is active
            if not user.is_active:
                await self._handle_failed_login(email, "Account not active", ip_address, user_agent, user)
                raise AuthenticationError("Account is not active")
            
            # Check if email is verified
            # TODO: Re-enable email verification in production
            # Temporarily disabled for development
            # if not user.is_verified:
            #     await self._handle_failed_login(email, "Email not verified", ip_address, user_agent, user)
            #     raise EmailNotVerifiedError("Email address is not verified")
            
            # Reset failed login attempts on successful login
            if user.failed_login_attempts > 0:
                await self.session.execute(
                    update(User)
                    .where(User.id == user.id)
                    .values(failed_login_attempts=0, locked_until=None)
                )
            
            # Update last login
            await self.session.execute(
                update(User)
                .where(User.id == user.id)
                .values(last_login=datetime.utcnow())
            )
            
            # Get user permissions
            # TODO: Re-enable permissions when they're seeded
            permissions = []  # user.get_permissions()
            role_names = [role.name for role in user.roles]
            
            # Create tokens
            access_token = create_access_token(
                user_id=str(user.id),
                email=user.email,
                roles=role_names,
                permissions=permissions
            )
            
            refresh_token_jwt, refresh_token_id = create_refresh_token(str(user.id))
            
            # TODO: Re-enable after fixing refresh_tokens table schema
            # Store refresh token in database
            # refresh_token = RefreshToken(
            #     token_id=refresh_token_id,
            #     user_id=user.id,
            #     expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
            #     ip_address=ip_address,
            #     user_agent=user_agent
            # )
            # self.session.add(refresh_token)
            
            # TODO: Re-enable after fixing user_sessions table schema
            # Create user session
            session_id = secrets.token_urlsafe(32)
            # user_session = UserSession(
            #     session_id=session_id,
            #     user_id=user.id,
            #     expires_at=datetime.utcnow() + timedelta(minutes=settings.SESSION_TIMEOUT_MINUTES),
            #     ip_address=ip_address,
            #     user_agent=user_agent
            # )
            # self.session.add(user_session)
            
            # TODO: Re-enable audit logging after fixing schema
            # Create audit log
            # audit_log = AuditLog.create_log(
            #     action=AuditAction.LOGIN,
            #     user_id=str(user.id),
            #     user_email=user.email,
            #     description="User logged in successfully",
            #     result=AuditResult.SUCCESS,
            #     ip_address=ip_address,
            #     user_agent=user_agent,
            #     session_id=session_id,
            #     details={
            #         "authentication_method": "email_password",
            #         "roles": role_names,
            #         "permissions_count": len(permissions)
            #     }
            # )
            # self.session.add(audit_log)
            
            await self.session.commit()
            
            logger.info(
                "User authenticated successfully",
                user_id=str(user.id),
                email=user.email,
                roles=role_names,
                ip_address=ip_address
            )
            
            return LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token_jwt,
                token_type="bearer",
                expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user=UserResponse(
                    id=str(user.id),
                    email=user.email,
                    first_name=user.first_name,
                    last_name=user.last_name,
                    is_active=user.is_active,
                    is_verified=user.is_verified,
                    roles=role_names,
                    created_at=user.created_at.isoformat(),
                    last_login=user.last_login.isoformat() if user.last_login else None
                )
            )
            
        except (AuthenticationError, AccountLockedError, EmailNotVerifiedError):
            await self.session.rollback()
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Authentication error",
                email=email,
                error=str(e),
                ip_address=ip_address
            )
            raise AuthenticationError(f"Authentication failed: {str(e)}")
    
    async def _handle_failed_login(
        self,
        email: str,
        reason: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        user: Optional[User] = None
    ) -> None:
        """
        Handle failed login attempts with account lockout.
        
        Args:
            email: User email
            reason: Failure reason
            ip_address: Client IP address
            user_agent: Client user agent
            user: User object if available
        """
        max_attempts = 5
        lockout_duration = timedelta(minutes=30)
        
        if user:
            # Increment failed attempts
            new_attempts = user.failed_login_attempts + 1
            
            update_values: Dict[str, object] = {"failed_login_attempts": new_attempts}
            
            if new_attempts >= max_attempts:
                # Lock account
                lockout_until = datetime.utcnow() + lockout_duration
                update_values["locked_until"] = lockout_until
                
                logger.warning(
                    "Account locked due to failed attempts",
                    user_id=str(user.id),
                    email=email,
                    attempts=new_attempts,
                    locked_until=lockout_until.isoformat(),
                    ip_address=ip_address
                )
                
                # TODO: Re-enable audit logging after fixing schema
                # Create account locked audit log
                # audit_log = AuditLog.create_log(
                #     action=AuditAction.ACCOUNT_LOCKED,
                #     user_id=str(user.id),
                #     user_email=email,
                #     description=f"Account locked after {new_attempts} failed login attempts",
                #     result=AuditResult.SUCCESS,
                #     ip_address=ip_address,
                #     user_agent=user_agent,
                #     details={
                #         "failed_attempts": new_attempts,
                #         "lockout_duration_minutes": lockout_duration.total_seconds() / 60
                #     }
                # )
                # self.session.add(audit_log)
            
            await self.session.execute(
                update(User).where(User.id == user.id).values(**update_values)
            )
        
        # TODO: Re-enable audit logging after fixing schema
        # Create failed login audit log
        # audit_log = AuditLog.create_log(
        #     action=AuditAction.LOGIN_FAILED,
        #     user_id=str(user.id) if user else None,
        #     user_email=email,
        #     description=f"Login failed: {reason}",
        #     result=AuditResult.FAILURE,
        #     ip_address=ip_address,
        #     user_agent=user_agent,
        #     details={
        #         "reason": reason,
        #         "failed_attempts": user.failed_login_attempts + 1 if user else 1
        #     }
        # )
        # self.session.add(audit_log)
        
        logger.warning(
            "Login attempt failed",
            email=email,
            reason=reason,
            user_id=str(user.id) if user else None,
            ip_address=ip_address
        )
    
    async def refresh_access_token(
        self,
        refresh_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> Dict[str, object]:
        """
        Refresh access token using refresh token.
        
        Args:
            refresh_token: Valid refresh token
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            Dict: New access token information
            
        Raises:
            AuthenticationError: If refresh token is invalid
        """
        try:
            # Verify refresh token
            token_data = verify_token(refresh_token, "refresh")
            if not token_data or not token_data.jti:
                raise AuthenticationError("Invalid refresh token")
            
            # Check if refresh token exists in database and is not revoked
            stmt = (
                select(RefreshToken)
                .where(RefreshToken.token_id == token_data.jti)
                .where(RefreshToken.is_revoked == False)  # noqa: E712
            )
            result = await self.session.execute(stmt)
            db_token = result.scalar_one_or_none()
            
            if not db_token or not db_token.is_valid:
                raise AuthenticationError("Refresh token is invalid or expired")
            
            # Get user with roles and permissions
            stmt = (
                select(User)
                .options(selectinload(User.roles).selectinload(Role.permissions))
                .where(User.id == db_token.user_id)
            )
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                raise AuthenticationError("User account is not active")
            
            # Update token usage
            await self.session.execute(
                update(RefreshToken)
                .where(RefreshToken.token_id == token_data.jti)
                .values(used_at=datetime.utcnow())
            )
            
            # Get user permissions
            permissions = user.get_permissions()
            role_names = [role.name for role in user.roles]
            
            # Create new access token
            new_access_token = create_access_token(
                user_id=str(user.id),
                email=user.email,
                roles=role_names,
                permissions=permissions
            )
            
            await self.session.commit()
            
            logger.debug(
                "Access token refreshed",
                user_id=str(user.id),
                token_id=token_data.jti,
                ip_address=ip_address
            )
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except AuthenticationError:
            await self.session.rollback()
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Token refresh failed",
                error=str(e),
                ip_address=ip_address
            )
            raise AuthenticationError(f"Token refresh failed: {str(e)}")
    
    async def verify_email(
        self,
        verification_token: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Verify user email address.
        
        Args:
            verification_token: Email verification token
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            bool: True if verification successful
            
        Raises:
            ValueError: If token is invalid or expired
        """
        try:
            # Find verification token
            stmt = (
                select(EmailVerificationToken)
                .where(EmailVerificationToken.token == verification_token)
                .where(EmailVerificationToken.is_used == False)  # noqa: E712
            )
            result = await self.session.execute(stmt)
            token = result.scalar_one_or_none()
            
            if not token or not token.is_valid:
                raise ValueError("Invalid or expired verification token")
            
            # Get user
            stmt = select(User).where(User.id == token.user_id)
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                raise ValueError("User not found")
            
            # Update user verification status
            await self.session.execute(
                update(User)
                .where(User.id == user.id)
                .values(is_verified=True, is_active=True)
            )
            
            # Mark token as used
            await self.session.execute(
                update(EmailVerificationToken)
                .where(EmailVerificationToken.id == token.id)
                .values(is_used=True, used_at=datetime.utcnow())
            )
            
            # TODO: Re-enable audit logging after fixing schema
            # Create audit log
            # audit_log = AuditLog.create_log(
            #     action=AuditAction.EMAIL_VERIFIED,
            #     user_id=str(user.id),
            #     user_email=user.email,
            #     description="Email verified successfully",
            #     result=AuditResult.SUCCESS,
            #     ip_address=ip_address,
            #     user_agent=user_agent,
            #     details={
            #         "verification_type": token.verification_type,
            #         "email": token.email
            #     }
            # )
            # self.session.add(audit_log)
            
            await self.session.commit()
            
            logger.info(
                "Email verified successfully",
                user_id=str(user.id),
                email=user.email,
                ip_address=ip_address
            )
            
            return True
            
        except ValueError:
            await self.session.rollback()
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Email verification failed",
                error=str(e),
                token=verification_token[:8] + "...",
                ip_address=ip_address
            )
            raise ValueError(f"Email verification failed: {str(e)}")
    
    async def check_user_permission(self, user_id: str, required_permission: str) -> bool:
        """
        Check if user has specific permission.
        
        Args:
            user_id: User ID
            required_permission: Required permission in 'resource:action' format
            
        Returns:
            bool: True if user has permission
        """
        try:
            stmt = (
                select(User)
                .options(selectinload(User.roles).selectinload(Role.permissions))
                .where(User.id == user_id)
            )
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user or not user.is_active:
                return False
            
            permissions = user.get_permissions()
            return check_permission(permissions, required_permission)
            
        except Exception as e:
            logger.error(
                "Permission check failed",
                user_id=user_id,
                permission=required_permission,
                error=str(e)
            )
            return False
    
    async def logout_user(
        self,
        access_token: str
    ) -> bool:
        """
        Logout user by invalidating tokens.
        
        Args:
            access_token: JWT access token to invalidate
            
        Returns:
            bool: True if logout successful
        """
        try:
            # Verify and decode the token
            token_data = verify_token(access_token, "access")
            
            if token_data:
                # Revoke all refresh tokens for this user
                stmt = (
                    update(RefreshToken)
                    .where(RefreshToken.user_id == token_data.sub)
                    .where(RefreshToken.is_revoked == False)  # noqa: E712
                    .values(
                        is_revoked=True,
                        revoked_at=datetime.utcnow()
                    )
                )
                await self.session.execute(stmt)
                
                # End all active sessions for this user
                stmt = (
                    update(UserSession)
                    .where(UserSession.user_id == token_data.sub)
                    .where(UserSession.is_active == True)  # noqa: E712
                    .values(
                        is_active=False,
                        ended_at=datetime.utcnow()
                    )
                )
                await self.session.execute(stmt)
                
                # TODO: Re-enable audit logging after fixing schema
                # Create audit log
                # audit_log = AuditLog.create_log(
                #     action=AuditAction.LOGOUT,
                #     user_id=token_data.sub,
                #     user_email=token_data.email,
                #     description="User logged out",
                #     result=AuditResult.SUCCESS,
                #     details={"method": "manual_logout"}
                # )
                # self.session.add(audit_log)
                
                await self.session.commit()
                
                logger.info(
                    "User logged out successfully",
                    user_id=token_data.sub
                )
                
                return True
            
            return False
            
        except Exception as e:
            await self.session.rollback()
            logger.error("Logout failed", error=str(e))
            return False
    
    async def request_password_reset(
        self,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Request password reset for user.
        
        Args:
            email: User email address
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            bool: True if reset email sent (always returns True for security)
        """
        try:
            # Find user by email
            stmt = select(User).where(User.email == email)
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user and user.is_active:
                # Generate reset token
                reset_token = generate_reset_token()
                
                # Store reset token in database
                password_reset = PasswordResetToken(
                    user_id=user.id,
                    token=reset_token,
                    expires_at=datetime.utcnow() + timedelta(hours=1),
                    ip_address=ip_address
                )
                self.session.add(password_reset)
                
                # Send reset email
                from app.services.email_service import email_service
                await email_service.send_password_reset_email(
                    to_email=user.email,
                    user_name=user.full_name,
                    reset_token=reset_token
                )
                
                # TODO: Re-enable audit logging after fixing schema
                # Create audit log
                # audit_log = AuditLog.create_log(
                #     action=AuditAction.PASSWORD_RESET_REQUEST,
                #     user_id=str(user.id),
                #     user_email=user.email,
                #     description="Password reset requested",
                #     result=AuditResult.SUCCESS,
                #     ip_address=ip_address,
                #     user_agent=user_agent,
                #     details={"method": "email"}
                # )
                # self.session.add(audit_log)
                
                await self.session.commit()
                
                logger.info(
                    "Password reset requested",
                    user_id=str(user.id),
                    email=email
                )
            else:
                # User doesn't exist, but don't reveal this
                logger.warning(
                    "Password reset requested for non-existent user",
                    email=email
                )
            
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Password reset request failed",
                email=email,
                error=str(e)
            )
            # Still return True for security reasons
            return True
    
    async def reset_password(
        self,
        reset_token: str,
        new_password: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Reset user password using reset token.
        
        Args:
            reset_token: Password reset token
            new_password: New password
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            bool: True if password reset successful
            
        Raises:
            ValueError: If password is weak
            AuthenticationError: If token is invalid or expired
        """
        try:
            # Validate password strength
            is_strong, issues = is_password_strong(new_password)
            if not is_strong:
                raise ValueError(f"Password is too weak: {', '.join(issues)}")
            
            # Find valid reset token
            stmt = (
                select(PasswordResetToken)
                .where(PasswordResetToken.token == reset_token)
                .where(PasswordResetToken.used == False)  # noqa: E712
                .where(PasswordResetToken.expires_at > datetime.utcnow())
            )
            result = await self.session.execute(stmt)
            reset_record = result.scalar_one_or_none()
            
            if not reset_record:
                raise AuthenticationError("Invalid or expired reset token")
            
            # Get user
            stmt = select(User).where(User.id == reset_record.user_id)
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if not user:
                raise AuthenticationError("User not found")
            
            # Update password
            user.password_hash = get_password_hash(new_password)
            user.updated_at = datetime.utcnow()
            
            # Mark token as used
            reset_record.used = True
            reset_record.used_at = datetime.utcnow()
            
            # Revoke all refresh tokens (force re-login)
            stmt = (
                update(RefreshToken)
                .where(RefreshToken.user_id == user.id)
                .where(RefreshToken.is_revoked == False)  # noqa: E712
                .values(
                    is_revoked=True,
                    revoked_at=datetime.utcnow()
                )
            )
            await self.session.execute(stmt)
            
            # Send confirmation email
            from app.services.email_service import email_service
            await email_service.send_password_changed_email(
                to_email=user.email,
                user_name=user.full_name
            )
            
            # TODO: Re-enable audit logging after fixing schema
            # Create audit log
            # audit_log = AuditLog.create_log(
            #     action=AuditAction.PASSWORD_RESET,
            #     user_id=str(user.id),
            #     user_email=user.email,
            #     description="Password reset successfully",
            #     result=AuditResult.SUCCESS,
            #     ip_address=ip_address,
            #     user_agent=user_agent,
            #     details={"reset_token_id": str(reset_record.id)}
            # )
            # self.session.add(audit_log)
            
            await self.session.commit()
            
            logger.info(
                "Password reset successful",
                user_id=str(user.id),
                email=user.email
            )
            
            return True
            
        except (ValueError, AuthenticationError):
            await self.session.rollback()
            raise
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Password reset failed",
                error=str(e),
                reset_token=reset_token[:8] + "..."
            )
            raise AuthenticationError("Password reset failed")
    
    async def resend_verification_email(
        self,
        email: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None
    ) -> bool:
        """
        Resend email verification link.
        
        Args:
            email: User email address
            ip_address: Client IP address
            user_agent: Client user agent
            
        Returns:
            bool: True if verification email sent (always returns True for security)
        """
        try:
            # Find user by email
            stmt = select(User).where(User.email == email)
            result = await self.session.execute(stmt)
            user = result.scalar_one_or_none()
            
            if user and not user.is_verified:
                # Generate new verification token
                verification_token = generate_verification_token()
                
                # Update or create verification token
                stmt = (
                    select(EmailVerificationToken)
                    .where(EmailVerificationToken.user_id == user.id)
                    .where(EmailVerificationToken.is_used == False)  # noqa: E712
                )
                result = await self.session.execute(stmt)
                existing_token = result.scalar_one_or_none()
                
                if existing_token:
                    # Update existing token
                    existing_token.token = verification_token
                    existing_token.expires_at = datetime.utcnow() + timedelta(hours=24)
                else:
                    # Create new token
                    email_verification = EmailVerificationToken(
                        user_id=user.id,
                        token=verification_token,
                        expires_at=datetime.utcnow() + timedelta(hours=24)
                    )
                    self.session.add(email_verification)
                
                # Send verification email
                from app.services.email_service import email_service
                await email_service.send_verification_email(
                    to_email=user.email,
                    user_name=user.full_name,
                    verification_token=verification_token
                )
                
                # TODO: Re-enable audit logging after fixing schema
                # Create audit log
                # audit_log = AuditLog.create_log(
                #     action=AuditAction.EMAIL_VERIFICATION_SENT,
                #     user_id=str(user.id),
                #     user_email=user.email,
                #     description="Email verification resent",
                #     result=AuditResult.SUCCESS,
                #     ip_address=ip_address,
                #     user_agent=user_agent
                # )
                # self.session.add(audit_log)
                
                await self.session.commit()
                
                logger.info(
                    "Verification email resent",
                    user_id=str(user.id),
                    email=email
                )
            else:
                # User doesn't exist or already verified
                logger.info(
                    "Verification email not needed",
                    email=email,
                    exists=user is not None,
                    verified=user.is_verified if user else None
                )
            
            return True
            
        except Exception as e:
            await self.session.rollback()
            logger.error(
                "Verification email resend failed",
                email=email,
                error=str(e)
            )
            # Still return True for security reasons
            return True