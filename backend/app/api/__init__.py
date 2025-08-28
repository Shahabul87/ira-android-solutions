"""
API Router Configuration

Main API router that includes all endpoint modules.
Organizes all API routes under a common prefix.
"""

from fastapi import APIRouter

from app.api.v1 import auth, health, users, oauth, two_factor

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(oauth.router, prefix="/auth", tags=["oauth"])
api_router.include_router(two_factor.router, prefix="/auth", tags=["two-factor"])
api_router.include_router(users.router, prefix="/users", tags=["users"])