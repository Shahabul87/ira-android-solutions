"""
User and Role Models

Defines the user authentication and authorization models including
users, roles, permissions, and their relationships.
"""

from datetime import datetime
from typing import List, Optional
from uuid import uuid4

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey, 
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    """
    User model for authentication and user management.
    
    Stores user account information, authentication details,
    and account status tracking.
    """
    
    __tablename__ = "users"
    
    # Primary fields
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
        nullable=False
    )
    hashed_password: Mapped[Optional[str]] = mapped_column(
        String(255),
        nullable=True  # Nullable for OAuth-only accounts
    )
    
    # Profile information
    first_name: Mapped[str] = mapped_column(String(100), nullable=False)
    last_name: Mapped[str] = mapped_column(String(100), nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String(100), unique=True, nullable=True)
    full_name: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    
    # OAuth provider IDs
    google_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    github_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    discord_id: Mapped[Optional[str]] = mapped_column(String(255), unique=True, nullable=True, index=True)
    
    # Account status
    is_active: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_superuser: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    email_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    
    # Two-Factor Authentication
    totp_secret: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    two_factor_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    two_factor_verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    backup_codes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # JSON array of encrypted codes
    two_factor_recovery_codes_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # WebAuthn/Passkeys (for future implementation)
    webauthn_credentials: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)
    
    # Security tracking
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    locked_until: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    failed_2fa_attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Flexible metadata storage (renamed to avoid SQLAlchemy conflict)
    user_metadata: Mapped[Optional[dict]] = mapped_column(JSONB, nullable=True, default=dict)
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary="user_roles",
        back_populates="users",
        lazy="selectin",
        primaryjoin="User.id == user_roles.c.user_id",
        secondaryjoin="user_roles.c.role_id == Role.id"
    )
    
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole",
        back_populates="user",
        cascade="all, delete-orphan",
        foreign_keys="[UserRole.user_id]"
    )
    
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    sessions: Mapped[List["UserSession"]] = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<User(id={self.id}, email={self.email})>"
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_locked(self) -> bool:
        """Check if account is currently locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def get_permissions(self) -> List[str]:
        """Get all permissions for this user from their roles."""
        permissions = set()
        for role in self.roles:
            for permission in role.permissions:
                permissions.add(f"{permission.resource}:{permission.action}")
        return list(permissions)


class Role(Base):
    """
    Role model for role-based access control.
    
    Defines roles that can be assigned to users and
    associated with specific permissions.
    """
    
    __tablename__ = "roles"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    name: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    is_system: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )
    
    # Relationships
    users: Mapped[List["User"]] = relationship(
        "User",
        secondary="user_roles",
        back_populates="roles",
        primaryjoin="Role.id == user_roles.c.role_id",
        secondaryjoin="user_roles.c.user_id == User.id"
    )
    
    permissions: Mapped[List["Permission"]] = relationship(
        "Permission",
        secondary="role_permissions",
        back_populates="roles",
        lazy="selectin"
    )
    
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission",
        back_populates="role",
        cascade="all, delete-orphan"
    )
    
    user_roles: Mapped[List["UserRole"]] = relationship(
        "UserRole",
        back_populates="role",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Role(id={self.id}, name={self.name})>"


class Permission(Base):
    """
    Permission model for granular access control.
    
    Defines specific permissions that can be granted to roles.
    Uses resource:action format (e.g., "users:read", "admin:manage").
    """
    
    __tablename__ = "permissions"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    resource: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    
    # Timestamps
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('resource', 'action', name='unique_resource_action'),
    )
    
    # Relationships
    roles: Mapped[List["Role"]] = relationship(
        "Role",
        secondary="role_permissions",
        back_populates="permissions"
    )
    
    role_permissions: Mapped[List["RolePermission"]] = relationship(
        "RolePermission",
        back_populates="permission",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"<Permission(id={self.id}, resource={self.resource}, action={self.action})>"
    
    @property
    def name(self) -> str:
        """Get permission name in resource:action format."""
        return f"{self.resource}:{self.action}"


class UserRole(Base):
    """
    Association table for User-Role many-to-many relationship.
    
    Tracks when roles were assigned and by whom for audit purposes.
    """
    
    __tablename__ = "user_roles"
    
    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )
    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    role_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        nullable=False
    )
    
    # Audit fields
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    assigned_by: Mapped[Optional[UUID]] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="user_roles",
        foreign_keys=[user_id]
    )
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="user_roles"
    )
    assigned_by_user: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_by]
    )
    
    def __repr__(self) -> str:
        return f"<UserRole(user_id={self.user_id}, role_id={self.role_id})>"


class RolePermission(Base):
    """
    Association table for Role-Permission many-to-many relationship.
    
    Tracks permission assignments to roles.
    """
    
    __tablename__ = "role_permissions"
    
    role_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("roles.id", ondelete="CASCADE"),
        primary_key=True
    )
    permission_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("permissions.id", ondelete="CASCADE"),
        primary_key=True
    )
    
    # Timestamps
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )
    
    # Relationships
    role: Mapped["Role"] = relationship(
        "Role",
        back_populates="role_permissions"
    )
    permission: Mapped["Permission"] = relationship(
        "Permission",
        back_populates="role_permissions"
    )
    
    def __repr__(self) -> str:
        return f"<RolePermission(role_id={self.role_id}, permission_id={self.permission_id})>"