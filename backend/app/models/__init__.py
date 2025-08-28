"""
Database Models

SQLAlchemy models for the enterprise authentication system.
All models inherit from the Base class defined in core.database.
"""

from app.models.user import User, Role, Permission, UserRole, RolePermission
from app.models.auth import RefreshToken, PasswordResetToken, EmailVerificationToken
from app.models.audit import AuditLog
from app.models.session import UserSession

# Export all models for Alembic auto-generation
__all__ = [
    "User",
    "Role", 
    "Permission",
    "UserRole",
    "RolePermission",
    "RefreshToken",
    "PasswordResetToken", 
    "EmailVerificationToken",
    "AuditLog",
    "UserSession"
]