"""
Two-Factor Authentication Endpoints

Handles 2FA setup, verification, and management including TOTP,
backup codes, and recovery mechanisms.
"""

from typing import Dict, List, Optional

import structlog
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db_session
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.schemas.auth import MessageResponse
from app.services.two_factor_service import TwoFactorError, TwoFactorService

logger = structlog.get_logger(__name__)

router = APIRouter()


# Request/Response schemas
class TwoFactorSetupResponse(BaseModel):
    """Two-factor setup response."""
    secret: str = Field(..., description="TOTP secret for manual entry")
    qr_code: str = Field(..., description="QR code as base64 data URI")
    backup_codes: List[str] = Field(..., description="Backup recovery codes")
    manual_entry_key: str = Field(..., description="Key for manual entry")
    manual_entry_uri: str = Field(..., description="Full URI for manual setup")


class TwoFactorVerifyRequest(BaseModel):
    """Two-factor verification request."""
    code: str = Field(..., min_length=6, max_length=8, description="TOTP or backup code")
    is_backup: bool = Field(False, description="Whether the code is a backup code")


class TwoFactorEnableRequest(BaseModel):
    """Enable two-factor request."""
    code: str = Field(..., min_length=6, max_length=6, description="TOTP verification code")


class TwoFactorDisableRequest(BaseModel):
    """Disable two-factor request."""
    password: str = Field(..., description="User password for verification")


class TwoFactorStatusResponse(BaseModel):
    """Two-factor status response."""
    enabled: bool = Field(..., description="Whether 2FA is enabled")
    verified_at: Optional[str] = Field(None, description="When 2FA was verified")
    backup_codes_remaining: int = Field(..., description="Number of unused backup codes")
    methods: Dict[str, bool] = Field(..., description="Available 2FA methods")


class BackupCodesResponse(BaseModel):
    """Backup codes response."""
    backup_codes: List[str] = Field(..., description="New backup recovery codes")
    warning: str = Field(
        "Store these codes in a safe place. Each code can only be used once.",
        description="Security warning"
    )


@router.get("/2fa/status", response_model=TwoFactorStatusResponse)
async def get_two_factor_status(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> TwoFactorStatusResponse:
    """
    Get two-factor authentication status for current user.
    
    Returns the current 2FA configuration including enabled methods
    and remaining backup codes.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        TwoFactorStatusResponse: Current 2FA status
    """
    logger.info("2FA status check", user_id=current_user.id)
    
    service = TwoFactorService(db)
    status = await service.get_2fa_status(current_user)
    
    return TwoFactorStatusResponse(**status)


@router.post("/2fa/setup", response_model=TwoFactorSetupResponse)
async def setup_two_factor(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> TwoFactorSetupResponse:
    """
    Set up two-factor authentication for current user.
    
    Generates a TOTP secret and QR code for the user to scan with
    their authenticator app. Also generates backup codes.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        TwoFactorSetupResponse: TOTP secret, QR code, and backup codes
        
    Raises:
        HTTPException: If 2FA is already enabled
    """
    logger.info("2FA setup requested", user_id=current_user.id)
    
    try:
        service = TwoFactorService(db)
        setup_data = await service.setup_totp(current_user)
        
        logger.info(
            "2FA setup initiated successfully",
            user_id=current_user.id
        )
        
        return TwoFactorSetupResponse(**setup_data)
        
    except TwoFactorError as e:
        logger.warning(
            "2FA setup failed",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "Unexpected error during 2FA setup",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to set up two-factor authentication"
        )


@router.post("/2fa/enable", response_model=MessageResponse)
async def enable_two_factor(
    request: TwoFactorEnableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Enable two-factor authentication after verification.
    
    Verifies the TOTP code from the user's authenticator app and
    enables 2FA if successful.
    
    Args:
        request: TOTP verification code
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If verification fails
    """
    logger.info("2FA enable requested", user_id=current_user.id)
    
    try:
        service = TwoFactorService(db)
        await service.verify_and_enable_totp(current_user, request.code)
        
        logger.info(
            "2FA enabled successfully",
            user_id=current_user.id
        )
        
        return MessageResponse(
            message="Two-factor authentication has been enabled successfully"
        )
        
    except TwoFactorError as e:
        logger.warning(
            "2FA enable failed",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "Unexpected error during 2FA enable",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to enable two-factor authentication"
        )


@router.post("/2fa/verify", response_model=MessageResponse)
async def verify_two_factor(
    request: TwoFactorVerifyRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Verify a two-factor authentication code.
    
    Verifies either a TOTP code or a backup code for the current user.
    
    Args:
        request: Code to verify
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If verification fails
    """
    logger.info(
        "2FA verification requested",
        user_id=current_user.id,
        is_backup=request.is_backup
    )
    
    try:
        service = TwoFactorService(db)
        verified = await service.verify_2fa_code(
            current_user,
            request.code,
            request.is_backup
        )
        
        if not verified:
            raise TwoFactorError("Invalid verification code")
        
        logger.info(
            "2FA verification successful",
            user_id=current_user.id,
            is_backup=request.is_backup
        )
        
        return MessageResponse(
            message="Two-factor authentication code verified successfully"
        )
        
    except TwoFactorError as e:
        logger.warning(
            "2FA verification failed",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "Unexpected error during 2FA verification",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify two-factor authentication code"
        )


@router.post("/2fa/disable", response_model=MessageResponse)
async def disable_two_factor(
    request: TwoFactorDisableRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Disable two-factor authentication.
    
    Disables 2FA after verifying the user's password.
    
    Args:
        request: User password for verification
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        MessageResponse: Success message
        
    Raises:
        HTTPException: If password verification fails
    """
    logger.info("2FA disable requested", user_id=current_user.id)
    
    try:
        service = TwoFactorService(db)
        await service.disable_two_factor(current_user, request.password)
        
        logger.info(
            "2FA disabled successfully",
            user_id=current_user.id
        )
        
        return MessageResponse(
            message="Two-factor authentication has been disabled"
        )
        
    except TwoFactorError as e:
        logger.warning(
            "2FA disable failed",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "Unexpected error during 2FA disable",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to disable two-factor authentication"
        )


@router.post("/2fa/backup-codes/regenerate", response_model=BackupCodesResponse)
async def regenerate_backup_codes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> BackupCodesResponse:
    """
    Regenerate backup codes for two-factor authentication.
    
    Generates new backup codes and invalidates all previous codes.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BackupCodesResponse: New backup codes
        
    Raises:
        HTTPException: If 2FA is not enabled
    """
    logger.info("Backup codes regeneration requested", user_id=current_user.id)
    
    try:
        service = TwoFactorService(db)
        backup_codes = await service.regenerate_backup_codes(current_user)
        
        logger.info(
            "Backup codes regenerated successfully",
            user_id=current_user.id
        )
        
        return BackupCodesResponse(backup_codes=backup_codes)
        
    except TwoFactorError as e:
        logger.warning(
            "Backup codes regeneration failed",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(
            "Unexpected error during backup codes regeneration",
            user_id=current_user.id,
            error=str(e)
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to regenerate backup codes"
        )


class RecoveryRequest(BaseModel):
    """Request body for 2FA recovery."""
    email: EmailStr = Field(..., description="User email address")


@router.post("/2fa/recovery/request", response_model=MessageResponse)
async def request_two_factor_recovery(
    request: RecoveryRequest,
    db: AsyncSession = Depends(get_db_session)
) -> MessageResponse:
    """
    Request two-factor authentication recovery.
    
    Sends a recovery email to the user with options to recover
    their account when 2FA is enabled and they can't access it.
    
    Args:
        email: User's email address
        db: Database session
        
    Returns:
        MessageResponse: Success message
    """
    from sqlalchemy import select
    
    logger.info("2FA recovery requested", email=request.email)
    
    # Find user by email
    result = await db.execute(
        select(User).where(User.email == request.email)
    )
    user = result.scalar_one_or_none()
    
    # Always return success to prevent email enumeration
    if not user or not user.two_factor_enabled:
        logger.warning(
            "2FA recovery requested for non-existent or non-2FA user",
            email=request.email
        )
    else:
        try:
            service = TwoFactorService(db)
            await service.send_2fa_recovery_email(user)
            
            logger.info(
                "2FA recovery email sent",
                user_id=user.id,
                email=request.email
            )
        except Exception as e:
            logger.error(
                "Failed to send 2FA recovery email",
                email=request.email,
                error=str(e)
            )
    
    return MessageResponse(
        message="If an account exists with this email and has 2FA enabled, a recovery email has been sent"
    )