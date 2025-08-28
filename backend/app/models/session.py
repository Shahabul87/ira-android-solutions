"""
Session Models

Models for managing user sessions and device tracking.
"""

from datetime import datetime
from typing import Optional
from uuid import uuid4

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class UserSession(Base):
    """
    User session model for tracking active user sessions.
    
    Tracks user sessions across different devices and browsers
    for security monitoring and session management.
    """
    
    __tablename__ = "user_sessions"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    session_id: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Session details
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    # Device and browser information
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True, index=True)
    user_agent: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    device_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)  # mobile, desktop, tablet
    browser: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    operating_system: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Location information (optional)
    country: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    city: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    
    # Session metadata (renamed to avoid SQLAlchemy conflict)
    session_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    ended_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="sessions"
    )
    
    def __repr__(self) -> str:
        return f"<UserSession(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"
    
    @property
    def is_expired(self) -> bool:
        """Check if the session has expired."""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if the session is valid (active and not expired)."""
        return self.is_active and not self.is_expired
    
    def end_session(self) -> None:
        """Mark the session as ended."""
        self.is_active = False
        self.ended_at = datetime.utcnow()
    
    def update_activity(self) -> None:
        """Update the last activity timestamp."""
        self.last_activity = datetime.utcnow()
    
    @property
    def duration(self) -> Optional[int]:
        """Get session duration in seconds."""
        if self.ended_at:
            return int((self.ended_at - self.created_at).total_seconds())
        return int((datetime.utcnow() - self.created_at).total_seconds())
    
    @property
    def device_info(self) -> str:
        """Get formatted device information."""
        parts = []
        if self.operating_system:
            parts.append(self.operating_system)
        if self.browser:
            parts.append(self.browser)
        if self.device_type:
            parts.append(self.device_type.title())
        
        return " / ".join(parts) if parts else "Unknown Device"
    
    @property
    def location_info(self) -> str:
        """Get formatted location information."""
        parts = []
        if self.city:
            parts.append(self.city)
        if self.country:
            parts.append(self.country)
        
        return ", ".join(parts) if parts else "Unknown Location"