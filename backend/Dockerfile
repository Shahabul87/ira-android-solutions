# Multi-stage Dockerfile for FastAPI Backend
# Optimized for both development and production

# =============================================================================
# Base stage - Common dependencies and setup
# =============================================================================
FROM python:3.11-slim as base

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1 \
    PIP_DEFAULT_TIMEOUT=100

# Create application directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN groupadd -r appuser && useradd -r -g appuser appuser

# =============================================================================
# Dependencies stage - Install Python dependencies
# =============================================================================
FROM base as deps

# Copy requirements
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# =============================================================================
# Development stage - For local development with hot reload
# =============================================================================
FROM deps as development

# Install development dependencies
RUN pip install --no-cache-dir \
    watchfiles \
    debugpy \
    pytest \
    pytest-asyncio \
    httpx \
    black \
    isort \
    flake8 \
    mypy

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Development command with hot reload
CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--log-level", "info"]

# =============================================================================
# Production stage - Optimized for production deployment
# =============================================================================
FROM deps as production

# Copy application code
COPY . .

# Create logs directory
RUN mkdir -p /app/logs && chown -R appuser:appuser /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Production command with gunicorn
CMD ["python", "-m", "gunicorn", "app.main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--log-level", "info", "--access-logfile", "/app/logs/access.log", "--error-logfile", "/app/logs/error.log"]

# =============================================================================
# Testing stage - For running tests in CI/CD
# =============================================================================
FROM development as testing

# Install additional testing tools
RUN pip install --no-cache-dir \
    coverage \
    pytest-cov \
    pytest-mock \
    factory-boy

# Copy test configuration
COPY pytest.ini .
COPY .coveragerc .

# Command to run tests
CMD ["python", "-m", "pytest", "--cov=app", "--cov-report=term-missing", "--cov-report=html", "-v"]