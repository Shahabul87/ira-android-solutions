"""
Database Seed Data

Creates initial roles, permissions, and admin user for the system.
Should be run after database migration.
"""

import asyncio
from datetime import datetime
from typing import List

import structlog
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import async_session_maker, init_db
from app.models.audit import AuditAction, AuditLog, AuditResult
from app.models.user import Permission, Role, User, UserRole

settings = get_settings()
logger = structlog.get_logger(__name__)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# System permissions definition
SYSTEM_PERMISSIONS = [
    # User management permissions
    ("users", "create", "Create new users"),
    ("users", "read", "View user information"),
    ("users", "update", "Update user information"),
    ("users", "delete", "Delete users"),
    ("users", "activate", "Activate user accounts"),
    ("users", "deactivate", "Deactivate user accounts"),
    
    # Profile permissions
    ("profile", "read", "View own profile"),
    ("profile", "update", "Update own profile"),
    
    # Role management permissions
    ("roles", "create", "Create new roles"),
    ("roles", "read", "View roles"),
    ("roles", "update", "Update roles"),
    ("roles", "delete", "Delete roles"),
    ("roles", "assign", "Assign roles to users"),
    
    # Permission management
    ("permissions", "read", "View permissions"),
    ("permissions", "manage", "Manage permissions"),
    
    # Admin panel access
    ("admin", "access", "Access admin panel"),
    ("admin", "users", "Manage users in admin panel"),
    ("admin", "roles", "Manage roles in admin panel"),
    ("admin", "audit", "View audit logs"),
    ("admin", "settings", "Manage system settings"),
    
    # Audit permissions
    ("audit", "read", "View audit logs"),
    ("audit", "export", "Export audit logs"),
    
    # Content permissions (example for extensibility)
    ("content", "create", "Create content"),
    ("content", "read", "View content"),
    ("content", "update", "Update content"),
    ("content", "delete", "Delete content"),
    ("content", "publish", "Publish content"),
    
    # System permissions
    ("system", "health", "View system health"),
    ("system", "metrics", "View system metrics"),
    ("system", "backup", "Perform system backup"),
    ("system", "maintenance", "Perform system maintenance"),
]

# System roles definition
SYSTEM_ROLES = {
    "super_admin": {
        "description": "Super Administrator with full system access",
        "permissions": ["*:*"],  # All permissions
        "is_system": True
    },
    "admin": {
        "description": "Administrator with user and content management access",
        "permissions": [
            "users:*",
            "roles:*", 
            "admin:*",
            "audit:read",
            "content:*",
            "system:health",
            "system:metrics"
        ],
        "is_system": True
    },
    "moderator": {
        "description": "Moderator with content management access",
        "permissions": [
            "users:read",
            "content:*",
            "audit:read"
        ],
        "is_system": True
    },
    "user": {
        "description": "Regular user with basic access",
        "permissions": [
            "profile:*",
            "content:read",
            "content:create"
        ],
        "is_system": True
    },
    "guest": {
        "description": "Guest user with minimal access",
        "permissions": [
            "content:read"
        ],
        "is_system": True
    }
}


async def create_permissions(session: AsyncSession) -> dict[str, Permission]:
    """
    Create system permissions.
    
    Args:
        session: Database session
        
    Returns:
        dict: Mapping of permission names to Permission objects
    """
    logger.info("Creating system permissions")
    
    permissions = {}
    
    for resource, action, description in SYSTEM_PERMISSIONS:
        # Check if permission already exists
        stmt = select(Permission).where(
            Permission.resource == resource,
            Permission.action == action
        )
        existing = await session.execute(stmt)
        permission = existing.scalar_one_or_none()
        
        if not permission:
            permission = Permission(
                resource=resource,
                action=action,
                description=description
            )
            session.add(permission)
            logger.info(
                "Created permission",
                resource=resource,
                action=action,
                description=description
            )
        
        permissions[f"{resource}:{action}"] = permission
    
    await session.flush()
    return permissions


async def create_roles(
    session: AsyncSession, 
    permissions: dict[str, Permission]
) -> dict[str, Role]:
    """
    Create system roles and assign permissions.
    
    Args:
        session: Database session
        permissions: Available permissions
        
    Returns:
        dict: Mapping of role names to Role objects
    """
    logger.info("Creating system roles")
    
    roles = {}
    
    for role_name, role_config in SYSTEM_ROLES.items():
        # Check if role already exists
        stmt = select(Role).where(Role.name == role_name)
        existing = await session.execute(stmt)
        role = existing.scalar_one_or_none()
        
        if not role:
            role = Role(
                name=role_name,
                description=role_config["description"],
                is_system=role_config["is_system"]
            )
            session.add(role)
            await session.flush()
            
            logger.info(
                "Created role",
                name=role_name,
                description=role_config["description"]
            )
        
        # Assign permissions to role
        role_permissions = role_config["permissions"]
        
        # Clear existing permissions for system roles (for updates)
        if role.is_system:
            role.permissions.clear()
        
        # Add permissions
        for perm_name in role_permissions:
            if perm_name == "*:*":
                # Assign all permissions
                for permission in permissions.values():
                    if permission not in role.permissions:
                        role.permissions.append(permission)
            else:
                permission = permissions.get(perm_name)
                if permission and permission not in role.permissions:
                    role.permissions.append(permission)
                    logger.debug(
                        "Assigned permission to role",
                        role=role_name,
                        permission=perm_name
                    )
        
        roles[role_name] = role
    
    await session.flush()
    return roles


async def create_admin_user(session: AsyncSession, roles: dict[str, Role]) -> User:
    """
    Create default admin user.
    
    Args:
        session: Database session
        roles: Available roles
        
    Returns:
        User: Created admin user
    """
    admin_email = "admin@example.com"
    admin_password = "SecureAdminPass123!"
    
    logger.info("Creating default admin user", email=admin_email)
    
    # Check if admin user already exists
    stmt = select(User).where(User.email == admin_email)
    existing = await session.execute(stmt)
    admin_user = existing.scalar_one_or_none()
    
    if not admin_user:
        # Create admin user
        admin_user = User(
            email=admin_email,
            hashed_password=pwd_context.hash(admin_password),
            first_name="System",
            last_name="Administrator",
            is_active=True,
            is_verified=True,
            is_superuser=True
        )
        session.add(admin_user)
        await session.flush()
        
        # Assign super_admin role
        super_admin_role = roles.get("super_admin")
        if super_admin_role:
            user_role = UserRole(
                user_id=admin_user.id,
                role_id=super_admin_role.id,
                assigned_at=datetime.utcnow()
            )
            session.add(user_role)
        
        logger.info(
            "Created admin user",
            email=admin_email,
            user_id=str(admin_user.id)
        )
        
        # Create audit log
        audit_log = AuditLog.create_log(
            action=AuditAction.USER_CREATED,
            description="Default admin user created during system initialization",
            resource="users",
            resource_id=str(admin_user.id),
            result=AuditResult.SUCCESS,
            details={
                "email": admin_email,
                "created_by": "system_seed",
                "roles": ["super_admin"]
            }
        )
        session.add(audit_log)
    
    await session.flush()
    return admin_user


async def create_test_user(session: AsyncSession, roles: dict[str, Role]) -> User:
    """
    Create test user for development.
    
    Args:
        session: Database session
        roles: Available roles
        
    Returns:
        User: Created test user
    """
    user_email = "user@example.com"
    user_password = "UserPass123!"
    
    logger.info("Creating test user", email=user_email)
    
    # Check if test user already exists
    stmt = select(User).where(User.email == user_email)
    existing = await session.execute(stmt)
    test_user = existing.scalar_one_or_none()
    
    if not test_user:
        # Create test user
        test_user = User(
            email=user_email,
            hashed_password=pwd_context.hash(user_password),
            first_name="Test",
            last_name="User",
            is_active=True,
            is_verified=True,
            is_superuser=False
        )
        session.add(test_user)
        await session.flush()
        
        # Assign user role
        user_role_obj = roles.get("user")
        if user_role_obj:
            user_role = UserRole(
                user_id=test_user.id,
                role_id=user_role_obj.id,
                assigned_at=datetime.utcnow()
            )
            session.add(user_role)
        
        logger.info(
            "Created test user",
            email=user_email,
            user_id=str(test_user.id)
        )
        
        # Create audit log
        audit_log = AuditLog.create_log(
            action=AuditAction.USER_CREATED,
            description="Test user created during system initialization",
            resource="users",
            resource_id=str(test_user.id),
            result=AuditResult.SUCCESS,
            details={
                "email": user_email,
                "created_by": "system_seed",
                "roles": ["user"]
            }
        )
        session.add(audit_log)
    
    await session.flush()
    return test_user


async def seed_database() -> None:
    """
    Seed the database with initial data.
    
    Creates permissions, roles, and default users.
    """
    logger.info("Starting database seeding")
    
    if not async_session_maker:
        await init_db()
    
    async with async_session_maker() as session:
        try:
            # Create permissions
            permissions = await create_permissions(session)
            logger.info(f"Created {len(permissions)} permissions")
            
            # Create roles
            roles = await create_roles(session, permissions)
            logger.info(f"Created {len(roles)} roles")
            
            # Create admin user
            admin_user = await create_admin_user(session, roles)
            
            # Create test user (only in development)
            if settings.ENVIRONMENT == "development":
                test_user = await create_test_user(session, roles)
            
            # Commit all changes
            await session.commit()
            
            logger.info("Database seeding completed successfully")
            
            # Log summary
            logger.info(
                "Seed data summary",
                permissions_created=len(permissions),
                roles_created=len(roles),
                admin_email="admin@example.com",
                test_user_created=settings.ENVIRONMENT == "development"
            )
            
        except Exception as e:
            await session.rollback()
            logger.error("Database seeding failed", error=str(e))
            raise


async def main():
    """Main function for running seed data script."""
    await seed_database()


if __name__ == "__main__":
    asyncio.run(main())