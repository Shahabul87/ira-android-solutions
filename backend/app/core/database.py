"""
Database Configuration and Session Management

Handles database connection, session management, and provides
utilities for database operations using SQLAlchemy 2.0 async.
"""

from typing import AsyncGenerator, Optional

import structlog
from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.pool import NullPool

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger(__name__)


class Base(DeclarativeBase):
    """
    Base class for all database models.
    
    Uses SQLAlchemy 2.0 declarative base with type annotations.
    """
    pass


# Global variables for database engine and session
engine: Optional[object] = None
async_session_maker: Optional[async_sessionmaker[AsyncSession]] = None


async def init_db() -> None:
    """
    Initialize database engine and session maker.
    
    Creates the async engine with proper configuration for
    connection pooling and logging.
    """
    global engine, async_session_maker
    
    logger.info("Initializing database connection", database_url=str(settings.DATABASE_URL))
    
    # Create async engine
    engine = create_async_engine(
        str(settings.DATABASE_URL),
        echo=settings.DEBUG,  # Log SQL queries in debug mode
        pool_size=settings.DB_POOL_SIZE,
        max_overflow=settings.DB_MAX_OVERFLOW,
        pool_timeout=settings.DB_POOL_TIMEOUT,
        pool_pre_ping=True,  # Validate connections before use
        # Use NullPool for testing to avoid connection issues
        poolclass=NullPool if settings.ENVIRONMENT == "testing" else None,
    )
    
    # Create session maker
    async_session_maker = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=False,
        autocommit=False,
    )
    
    # Set up event listeners for logging
    if settings.DEBUG:
        @event.listens_for(engine.sync_engine, "before_cursor_execute")
        def receive_before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
            """Log SQL queries in debug mode."""
            logger.debug(
                "Executing SQL",
                statement=statement,
                parameters=parameters if len(str(parameters)) < 500 else "[Large parameters]"
            )
    
    logger.info("Database connection initialized successfully")


async def close_db() -> None:
    """
    Close database connections.
    
    Properly closes the database engine and all associated connections.
    """
    global engine
    
    if engine:
        logger.info("Closing database connections")
        await engine.dispose()
        logger.info("Database connections closed")


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    Get database session for dependency injection.
    
    Yields an async database session that automatically handles
    commit/rollback and cleanup.
    
    Yields:
        AsyncSession: Database session
        
    Raises:
        Exception: If database is not initialized
    """
    if async_session_maker is None:
        raise Exception("Database not initialized. Call init_db() first.")
    
    async with async_session_maker() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


class DatabaseManager:
    """
    Database manager for handling transactions and bulk operations.
    
    Provides utilities for common database operations with proper
    error handling and transaction management.
    """
    
    def __init__(self, session: AsyncSession):
        """
        Initialize database manager with session.
        
        Args:
            session: Async database session
        """
        self.session = session
    
    async def save(self, instance) -> None:
        """
        Save an instance to the database.
        
        Args:
            instance: SQLAlchemy model instance
        """
        self.session.add(instance)
        await self.session.flush()
    
    async def delete(self, instance) -> None:
        """
        Delete an instance from the database.
        
        Args:
            instance: SQLAlchemy model instance
        """
        await self.session.delete(instance)
        await self.session.flush()
    
    async def commit(self) -> None:
        """Commit the current transaction."""
        await self.session.commit()
    
    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self.session.rollback()
    
    async def refresh(self, instance) -> None:
        """
        Refresh an instance from the database.
        
        Args:
            instance: SQLAlchemy model instance
        """
        await self.session.refresh(instance)


# Utility functions for testing and migrations

async def create_tables() -> None:
    """
    Create all database tables.
    
    Used for testing and initial setup. In production,
    use Alembic migrations instead.
    """
    if engine is None:
        raise Exception("Database not initialized. Call init_db() first.")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    logger.info("Database tables created")


async def drop_tables() -> None:
    """
    Drop all database tables.
    
    Used for testing cleanup. Be very careful with this in production!
    """
    if engine is None:
        raise Exception("Database not initialized. Call init_db() first.")
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    
    logger.info("Database tables dropped")