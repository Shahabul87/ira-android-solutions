"""
Structured Logging Configuration

Sets up structured logging using structlog for better observability
and debugging in production environments.
"""

import logging
import sys
from typing import Any, Dict

import structlog
from structlog.types import Processor

from app.core.config import get_settings

settings = get_settings()


def add_request_id(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add request ID to log entries if available.
    
    Args:
        logger: The logger instance
        method_name: The log method name
        event_dict: The event dictionary
        
    Returns:
        Dict: Updated event dictionary with request ID
    """
    # Try to get request ID from context (will be set by middleware)
    from contextvars import ContextVar
    
    request_id_var: ContextVar[str] = ContextVar('request_id', default='')
    request_id = request_id_var.get()
    
    if request_id:
        event_dict['request_id'] = request_id
    
    return event_dict


def add_user_info(logger: Any, method_name: str, event_dict: Dict[str, Any]) -> Dict[str, Any]:
    """
    Add user information to log entries if available.
    
    Args:
        logger: The logger instance
        method_name: The log method name
        event_dict: The event dictionary
        
    Returns:
        Dict: Updated event dictionary with user info
    """
    # Try to get user info from context (will be set by auth middleware)
    from contextvars import ContextVar
    
    user_id_var: ContextVar[str] = ContextVar('user_id', default='')
    user_email_var: ContextVar[str] = ContextVar('user_email', default='')
    
    user_id = user_id_var.get()
    user_email = user_email_var.get()
    
    if user_id:
        event_dict['user_id'] = user_id
    if user_email:
        event_dict['user_email'] = user_email
    
    return event_dict


def setup_logging() -> None:
    """
    Configure structured logging for the application.
    
    Sets up processors based on environment and format preferences.
    """
    # Configure standard library logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, settings.LOG_LEVEL.upper()),
    )
    
    # Set up structlog processors
    processors: list[Processor] = [
        structlog.contextvars.merge_contextvars,
        add_request_id,
        add_user_info,
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
    ]
    
    if settings.LOG_FORMAT == "json":
        # JSON format for production
        processors.extend([
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer()
        ])
    else:
        # Human-readable format for development
        processors.extend([
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(colors=True)
        ])
    
    # Configure structlog
    structlog.configure(
        processors=processors,
        wrapper_class=structlog.stdlib.BoundLogger,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
    
    # Configure specific loggers
    
    # Reduce noise from uvicorn access logs in development
    if settings.ENVIRONMENT == "development":
        logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    
    # Set SQLAlchemy logging level
    if settings.DEBUG:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.INFO)
    else:
        logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    
    # Set httpx logging level (for OAuth requests)
    logging.getLogger("httpx").setLevel(logging.WARNING)


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structured logger instance.
    
    Args:
        name: Logger name (usually __name__)
        
    Returns:
        structlog.BoundLogger: Configured logger instance
    """
    return structlog.get_logger(name)