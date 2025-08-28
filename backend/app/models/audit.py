"""
Audit Log Models

Models for tracking user actions and system events for compliance
and security monitoring.
"""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class AuditLog(Base):
    """
    Audit log model for tracking user actions and system events.
    
    Provides comprehensive logging for security, compliance,
    and debugging purposes.
    """
    
    __tablename__ = "audit_logs"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    
    # User information (nullable for system events)
    user_id: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    user_email: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    
    # Action details
    action: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    resource: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
    resource_id: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True,
        index=True
    )
    
    # Event details
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    details: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)
    
    # Result information
    result: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="success",
        index=True
    )  # success, failure, error
    error_message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Request context
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    request_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    session_id: Mapped[Optional[str]] = mapped_column(String(255), nullable=True, index=True)
    
    # Timestamps
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    # Relationships
    user: Mapped[Optional["User"]] = relationship(
        "User",
        back_populates="audit_logs"
    )
    
    def __repr__(self) -> str:
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id}, timestamp={self.timestamp})>"
    
    @classmethod
    def create_log(
        cls,
        action: str,
        user_id: Optional[str] = None,
        user_email: Optional[str] = None,
        resource: Optional[str] = None,
        resource_id: Optional[str] = None,
        description: Optional[str] = None,
        details: Optional[dict] = None,
        result: str = "success",
        error_message: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        request_id: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> "AuditLog":
        """
        Create an audit log entry.
        
        Args:
            action: The action being performed
            user_id: ID of the user performing the action
            user_email: Email of the user performing the action
            resource: Type of resource being acted upon
            resource_id: ID of the specific resource
            description: Human-readable description of the action
            details: Additional structured data about the action
            result: Result of the action (success, failure, error)
            error_message: Error message if action failed
            ip_address: IP address of the request
            user_agent: User agent string of the request
            request_id: Unique request identifier
            session_id: Session identifier
            
        Returns:
            AuditLog: Created audit log instance
        """
        return cls(
            user_id=user_id,
            user_email=user_email,
            action=action,
            resource=resource,
            resource_id=resource_id,
            description=description,
            details=details or {},
            result=result,
            error_message=error_message,
            ip_address=ip_address,
            user_agent=user_agent,
            request_id=request_id,
            session_id=session_id,
        )


# Common audit actions for consistency
class AuditAction:
    """Constants for common audit actions."""
    
    # Authentication actions
    LOGIN = "login"
    LOGOUT = "logout"
    LOGIN_FAILED = "login_failed"
    PASSWORD_RESET_REQUEST = "password_reset_request"
    PASSWORD_RESET = "password_reset"
    PASSWORD_RESET_REQUESTED = "password_reset_requested"
    PASSWORD_RESET_COMPLETED = "password_reset_completed"
    EMAIL_VERIFIED = "email_verified"
    EMAIL_VERIFICATION_SENT = "email_verification_sent"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"
    
    # User management actions
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_ACTIVATED = "user_activated"
    USER_DEACTIVATED = "user_deactivated"
    
    # Role and permission actions
    ROLE_ASSIGNED = "role_assigned"
    ROLE_REMOVED = "role_removed"
    ROLE_CREATED = "role_created"
    ROLE_UPDATED = "role_updated"
    ROLE_DELETED = "role_deleted"
    PERMISSION_GRANTED = "permission_granted"
    PERMISSION_REVOKED = "permission_revoked"
    
    # Admin actions
    ADMIN_ACCESS = "admin_access"
    BULK_USER_UPDATE = "bulk_user_update"
    SYSTEM_CONFIGURATION_CHANGED = "system_configuration_changed"
    
    # OAuth actions
    OAUTH_LOGIN = "oauth_login"
    OAUTH_ACCOUNT_LINKED = "oauth_account_linked"
    OAUTH_ACCOUNT_UNLINKED = "oauth_account_unlinked"
    
    # API actions
    API_KEY_CREATED = "api_key_created"
    API_KEY_REVOKED = "api_key_revoked"
    API_ACCESS_DENIED = "api_access_denied"
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"


# Common audit results
class AuditResult:
    """Constants for audit results."""
    
    SUCCESS = "success"
    FAILURE = "failure"
    ERROR = "error"