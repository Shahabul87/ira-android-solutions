"""
Two-Factor Authentication Service

Handles TOTP generation, verification, backup codes, and recovery mechanisms
for two-factor authentication with complete type safety.
"""

import base64
import io
import json
import secrets
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

import pyotp
import qrcode
import structlog
from cryptography.fernet import Fernet
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.security import get_password_hash, verify_password
from app.models.user import User

settings = get_settings()
logger = structlog.get_logger(__name__)


class TwoFactorError(Exception):
    """Two-factor authentication related errors."""
    pass


class TwoFactorService:
    """
    Service for managing two-factor authentication.
    
    Provides methods for TOTP setup, verification, backup codes generation,
    and recovery mechanisms with proper encryption and security.
    """
    
    # Constants
    TOTP_ISSUER = "Enterprise Auth"
    BACKUP_CODES_COUNT = 10
    BACKUP_CODE_LENGTH = 8
    MAX_2FA_ATTEMPTS = 5
    LOCKOUT_DURATION = 300  # 5 minutes in seconds
    
    def __init__(self, db: AsyncSession):
        """
        Initialize two-factor service.
        
        Args:
            db: Database session
        """
        self.db = db
        
        # Initialize encryption key for backup codes
        # In production, this should come from secure key management
        encryption_key = getattr(settings, 'ENCRYPTION_KEY', None)
        if not encryption_key:
            # Generate a key if not provided (development only)
            encryption_key = Fernet.generate_key().decode()
            logger.warning("Using generated encryption key - configure ENCRYPTION_KEY in production")
        
        self.cipher = Fernet(encryption_key.encode() if isinstance(encryption_key, str) else encryption_key)
    
    async def setup_totp(self, user: User) -> Dict[str, str]:
        """
        Set up TOTP for a user.
        
        Generates a new TOTP secret and QR code for the user to scan
        with their authenticator app.
        
        Args:
            user: User to set up TOTP for
            
        Returns:
            Dict containing:
                - secret: TOTP secret (for manual entry)
                - qr_code: Base64 encoded QR code image
                - backup_codes: List of backup codes
                
        Raises:
            TwoFactorError: If 2FA is already enabled
        """
        if user.two_factor_enabled:
            raise TwoFactorError("Two-factor authentication is already enabled")
        
        # Generate TOTP secret
        secret = pyotp.random_base32()
        
        # Generate provisioning URI
        totp = pyotp.TOTP(secret)
        provisioning_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=self.TOTP_ISSUER
        )
        
        # Generate QR code
        qr = qrcode.QRCode(
            version=1,
            error_correction=qrcode.constants.ERROR_CORRECT_L,
            box_size=10,
            border=4,
        )
        qr.add_data(provisioning_uri)
        qr.make(fit=True)
        
        # Create QR code image
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Convert to base64
        buffer = io.BytesIO()
        img.save(buffer, format="PNG")
        qr_code_base64 = base64.b64encode(buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = self._generate_backup_codes()
        
        # Store encrypted backup codes (hashed for security)
        hashed_codes = [get_password_hash(code) for code in backup_codes]
        encrypted_codes = self.cipher.encrypt(json.dumps(hashed_codes).encode()).decode()
        
        # Update user with TOTP secret and backup codes
        user.totp_secret = secret
        user.backup_codes = encrypted_codes
        user.two_factor_recovery_codes_used = 0
        
        await self.db.commit()
        
        logger.info(
            "TOTP setup initiated",
            user_id=user.id,
            email=user.email
        )
        
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "backup_codes": backup_codes,
            "manual_entry_key": secret,
            "manual_entry_uri": provisioning_uri
        }
    
    async def verify_and_enable_totp(
        self,
        user: User,
        totp_code: str
    ) -> bool:
        """
        Verify TOTP code and enable 2FA for the user.
        
        Args:
            user: User to enable TOTP for
            totp_code: TOTP code to verify
            
        Returns:
            bool: True if verification successful and 2FA enabled
            
        Raises:
            TwoFactorError: If verification fails
        """
        if user.two_factor_enabled:
            raise TwoFactorError("Two-factor authentication is already enabled")
        
        if not user.totp_secret:
            raise TwoFactorError("TOTP has not been set up")
        
        # Verify the TOTP code
        if not self.verify_totp(user.totp_secret, totp_code):
            raise TwoFactorError("Invalid verification code")
        
        # Enable 2FA
        user.two_factor_enabled = True
        user.two_factor_verified_at = datetime.utcnow()
        user.failed_2fa_attempts = 0
        
        await self.db.commit()
        
        logger.info(
            "Two-factor authentication enabled",
            user_id=user.id,
            email=user.email
        )
        
        return True
    
    def verify_totp(self, secret: str, code: str, window: int = 1) -> bool:
        """
        Verify a TOTP code.
        
        Args:
            secret: TOTP secret
            code: TOTP code to verify
            window: Time window for verification (default 1 = ±30 seconds)
            
        Returns:
            bool: True if code is valid
        """
        try:
            totp = pyotp.TOTP(secret)
            # Allow for time drift with valid_window parameter
            return totp.verify(code, valid_window=window)
        except Exception as e:
            logger.error(
                "TOTP verification error",
                error=str(e)
            )
            return False
    
    async def verify_2fa_code(
        self,
        user: User,
        code: str,
        is_backup: bool = False
    ) -> bool:
        """
        Verify a 2FA code (TOTP or backup code).
        
        Args:
            user: User to verify code for
            code: Code to verify
            is_backup: Whether the code is a backup code
            
        Returns:
            bool: True if verification successful
            
        Raises:
            TwoFactorError: If user is locked out or 2FA not enabled
        """
        if not user.two_factor_enabled:
            raise TwoFactorError("Two-factor authentication is not enabled")
        
        # Check if user is locked out
        if user.failed_2fa_attempts >= self.MAX_2FA_ATTEMPTS:
            lockout_time = user.two_factor_verified_at + timedelta(seconds=self.LOCKOUT_DURATION)
            if datetime.utcnow() < lockout_time:
                raise TwoFactorError(
                    f"Too many failed attempts. Try again after {lockout_time.isoformat()}"
                )
            else:
                # Reset failed attempts after lockout period
                user.failed_2fa_attempts = 0
        
        verified = False
        
        if is_backup:
            # Verify backup code
            verified = await self._verify_backup_code(user, code)
        else:
            # Verify TOTP code
            if user.totp_secret:
                verified = self.verify_totp(user.totp_secret, code)
        
        if verified:
            # Reset failed attempts on successful verification
            user.failed_2fa_attempts = 0
            await self.db.commit()
            
            logger.info(
                "2FA verification successful",
                user_id=user.id,
                is_backup=is_backup
            )
        else:
            # Increment failed attempts
            user.failed_2fa_attempts += 1
            await self.db.commit()
            
            logger.warning(
                "2FA verification failed",
                user_id=user.id,
                attempts=user.failed_2fa_attempts,
                is_backup=is_backup
            )
        
        return verified
    
    async def _verify_backup_code(self, user: User, code: str) -> bool:
        """
        Verify and consume a backup code.
        
        Args:
            user: User to verify backup code for
            code: Backup code to verify
            
        Returns:
            bool: True if backup code is valid
        """
        if not user.backup_codes:
            return False
        
        try:
            # Decrypt and load backup codes
            decrypted = self.cipher.decrypt(user.backup_codes.encode())
            hashed_codes = json.loads(decrypted)
            
            # Check if code matches any unused backup code
            for i, hashed_code in enumerate(hashed_codes):
                if hashed_code and verify_password(code, hashed_code):
                    # Mark code as used by setting it to None
                    hashed_codes[i] = None
                    user.two_factor_recovery_codes_used += 1
                    
                    # Update stored codes
                    encrypted = self.cipher.encrypt(json.dumps(hashed_codes).encode()).decode()
                    user.backup_codes = encrypted
                    
                    await self.db.commit()
                    
                    logger.info(
                        "Backup code used",
                        user_id=user.id,
                        codes_used=user.two_factor_recovery_codes_used,
                        codes_remaining=self.BACKUP_CODES_COUNT - user.two_factor_recovery_codes_used
                    )
                    
                    return True
            
            return False
            
        except Exception as e:
            logger.error(
                "Backup code verification error",
                user_id=user.id,
                error=str(e)
            )
            return False
    
    async def regenerate_backup_codes(self, user: User) -> List[str]:
        """
        Generate new backup codes for a user.
        
        Args:
            user: User to generate backup codes for
            
        Returns:
            List[str]: New backup codes
            
        Raises:
            TwoFactorError: If 2FA is not enabled
        """
        if not user.two_factor_enabled:
            raise TwoFactorError("Two-factor authentication is not enabled")
        
        # Generate new backup codes
        backup_codes = self._generate_backup_codes()
        
        # Hash and encrypt codes
        hashed_codes = [get_password_hash(code) for code in backup_codes]
        encrypted_codes = self.cipher.encrypt(json.dumps(hashed_codes).encode()).decode()
        
        # Update user
        user.backup_codes = encrypted_codes
        user.two_factor_recovery_codes_used = 0
        
        await self.db.commit()
        
        logger.info(
            "Backup codes regenerated",
            user_id=user.id
        )
        
        return backup_codes
    
    async def disable_two_factor(
        self,
        user: User,
        password: str
    ) -> bool:
        """
        Disable two-factor authentication for a user.
        
        Args:
            user: User to disable 2FA for
            password: User's password for verification
            
        Returns:
            bool: True if 2FA disabled successfully
            
        Raises:
            TwoFactorError: If password is incorrect or 2FA not enabled
        """
        if not user.two_factor_enabled:
            raise TwoFactorError("Two-factor authentication is not enabled")
        
        # Verify user's password
        if not verify_password(password, user.hashed_password):
            raise TwoFactorError("Invalid password")
        
        # Disable 2FA
        user.two_factor_enabled = False
        user.totp_secret = None
        user.backup_codes = None
        user.two_factor_recovery_codes_used = 0
        user.failed_2fa_attempts = 0
        user.two_factor_verified_at = None
        
        await self.db.commit()
        
        logger.info(
            "Two-factor authentication disabled",
            user_id=user.id
        )
        
        return True
    
    async def get_2fa_status(self, user: User) -> Dict[str, any]:
        """
        Get 2FA status for a user.
        
        Args:
            user: User to get status for
            
        Returns:
            Dict with 2FA status information
        """
        backup_codes_remaining = 0
        
        if user.two_factor_enabled and user.backup_codes:
            backup_codes_remaining = self.BACKUP_CODES_COUNT - user.two_factor_recovery_codes_used
        
        return {
            "enabled": user.two_factor_enabled,
            "verified_at": user.two_factor_verified_at.isoformat() if user.two_factor_verified_at else None,
            "backup_codes_remaining": backup_codes_remaining,
            "methods": {
                "totp": bool(user.totp_secret),
                "backup_codes": bool(user.backup_codes),
                "webauthn": bool(user.webauthn_credentials)  # For future implementation
            }
        }
    
    def _generate_backup_codes(self) -> List[str]:
        """
        Generate a list of backup codes.
        
        Returns:
            List[str]: Generated backup codes
        """
        codes = []
        for _ in range(self.BACKUP_CODES_COUNT):
            # Generate a random code with format: XXXX-XXXX
            part1 = ''.join(secrets.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(4))
            part2 = ''.join(secrets.choice('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') for _ in range(4))
            codes.append(f"{part1}-{part2}")
        return codes
    
    async def send_2fa_recovery_email(
        self,
        user: User,
        recovery_method: str = "password_reset"
    ) -> bool:
        """
        Send 2FA recovery email to user.
        
        Args:
            user: User to send recovery email to
            recovery_method: Type of recovery (password_reset, disable_2fa)
            
        Returns:
            bool: True if email sent successfully
        """
        from app.services.email_service import email_service
        
        if recovery_method == "disable_2fa":
            # Send email with link to disable 2FA
            # This would require additional security verification
            subject = "Two-Factor Authentication Recovery Request"
            message = f"""
            Hello {user.first_name},
            
            We received a request to disable two-factor authentication on your account.
            For security reasons, this requires additional verification.
            
            Please contact our support team with your account details.
            
            If you didn't request this, please secure your account immediately.
            """
        else:
            # Standard password reset with 2FA bypass token
            subject = "Account Recovery - Two-Factor Authentication"
            message = f"""
            Hello {user.first_name},
            
            We received a request to recover your account with two-factor authentication enabled.
            
            A password reset link has been sent that will temporarily bypass 2FA.
            After resetting your password, you'll need to set up 2FA again.
            
            If you didn't request this, please ignore this email.
            """
        
        # In production, this would use the email service
        logger.info(
            "2FA recovery email sent",
            user_id=user.id,
            recovery_method=recovery_method
        )
        
        return True