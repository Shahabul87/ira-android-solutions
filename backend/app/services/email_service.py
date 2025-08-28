"""
Email Service

Handles all email communications including verification emails,
password reset emails, and notifications with proper templates.
"""

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

import structlog

from app.core.config import get_settings

settings = get_settings()
logger = structlog.get_logger(__name__)


class EmailError(Exception):
    """Email service related errors."""
    pass


class EmailService:
    """
    Email service for sending transactional emails.
    
    Provides methods for sending verification emails, password resets,
    and other notifications using SMTP with proper error handling.
    """
    
    def __init__(self) -> None:
        """Initialize email service with configuration."""
        self.smtp_host: str = settings.SMTP_HOST or ""
        self.smtp_port: int = settings.SMTP_PORT or 587
        self.smtp_user: str = settings.SMTP_USER or ""
        self.smtp_password: str = settings.SMTP_PASSWORD or ""
        self.from_email: str = settings.EMAIL_FROM or "noreply@enterprise-auth.com"
        self.app_name: str = "Enterprise Auth"
        self.frontend_url: str = settings.FRONTEND_URL or "http://localhost:3000"
        
        # Check if email service is configured
        self.is_configured: bool = bool(
            self.smtp_host and 
            self.smtp_user and 
            self.smtp_password
        )
    
    def _get_smtp_connection(self) -> smtplib.SMTP:
        """
        Create and return SMTP connection.
        
        Returns:
            SMTP connection object
            
        Raises:
            EmailError: If connection fails
        """
        try:
            smtp = smtplib.SMTP(self.smtp_host, self.smtp_port)
            smtp.starttls()
            smtp.login(self.smtp_user, self.smtp_password)
            return smtp
        except Exception as e:
            logger.error("Failed to connect to SMTP server", error=str(e))
            raise EmailError(f"Failed to connect to email server: {str(e)}")
    
    def _send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        text_content: Optional[str] = None
    ) -> bool:
        """
        Send an email using SMTP.
        
        Args:
            to_email: Recipient email address
            subject: Email subject
            html_content: HTML email content
            text_content: Plain text content (optional)
            
        Returns:
            bool: True if email sent successfully
            
        Raises:
            EmailError: If sending fails
        """
        if not self.is_configured:
            logger.warning(
                "Email service not configured, skipping email",
                to_email=to_email,
                subject=subject
            )
            return False
        
        try:
            msg = MIMEMultipart('alternative')
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add plain text part if provided
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            # Add HTML part
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # Send email
            with self._get_smtp_connection() as smtp:
                smtp.send_message(msg)
            
            logger.info(
                "Email sent successfully",
                to_email=to_email,
                subject=subject
            )
            return True
            
        except Exception as e:
            logger.error(
                "Failed to send email",
                to_email=to_email,
                subject=subject,
                error=str(e)
            )
            raise EmailError(f"Failed to send email: {str(e)}")
    
    async def send_verification_email(
        self,
        to_email: str,
        user_name: str,
        verification_token: str
    ) -> bool:
        """
        Send email verification link.
        
        Args:
            to_email: Recipient email address
            user_name: User's name
            verification_token: Email verification token
            
        Returns:
            bool: True if email sent successfully
        """
        from datetime import datetime
        
        verification_url = f"{self.frontend_url}/auth/verify-email?token={verification_token}"
        subject = f"Verify your {self.app_name} account"
        
        # Try to use template if available
        if self.template_env:
            try:
                template = self.template_env.get_template('verification.html')
                html_content = template.render(
                    app_name=self.app_name,
                    user_name=user_name,
                    verification_url=verification_url,
                    frontend_url=self.frontend_url,
                    current_year=datetime.now().year
                )
            except Exception as e:
                logger.warning(f"Failed to load email template: {e}, using inline template")
                html_content = self._get_inline_verification_html(user_name, verification_url)
        else:
            html_content = self._get_inline_verification_html(user_name, verification_url)
        
        text_content = f"""
        Welcome to {self.app_name}, {user_name}!
        
        Please verify your email address by visiting the following link:
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create an account with {self.app_name}, please ignore this email.
        
        Best regards,
        The {self.app_name} Team
        """
        
        return await self._send_email_async(to_email, subject, html_content, text_content)
    
    def _get_inline_verification_html(self, user_name: str, verification_url: str) -> str:
        """Get inline HTML template for verification email."""
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #4A90E2; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #4A90E2; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>{self.app_name}</h1>
                </div>
                <div class="content">
                    <h2>Welcome, {user_name}!</h2>
                    <p>Thank you for signing up for {self.app_name}. To complete your registration, 
                       please verify your email address by clicking the button below:</p>
                    <div style="text-align: center;">
                        <a href="{verification_url}" class="button">Verify Email Address</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #fff; padding: 10px; border: 1px solid #ddd;">
                        {verification_url}
                    </p>
                    <p>This link will expire in 24 hours.</p>
                    <p>If you didn't create an account with {self.app_name}, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {self.app_name}. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
    
    async def send_password_reset_email(
        self,
        to_email: str,
        user_name: str,
        reset_token: str
    ) -> bool:
        """
        Send password reset email.
        
        Args:
            to_email: Recipient email address
            user_name: User's name
            reset_token: Password reset token
            
        Returns:
            bool: True if email sent successfully
        """
        reset_url = f"{self.frontend_url}/auth/reset-password?token={reset_token}"
        
        subject = f"Reset your {self.app_name} password"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #E74C3C; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .button {{ display: inline-block; padding: 12px 30px; background-color: #E74C3C; 
                          color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
                .warning {{ background-color: #FFF3CD; border: 1px solid #FFC107; padding: 15px; 
                           border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello, {user_name}</h2>
                    <p>We received a request to reset your password for your {self.app_name} account.</p>
                    <p>Click the button below to reset your password:</p>
                    <div style="text-align: center;">
                        <a href="{reset_url}" class="button">Reset Password</a>
                    </div>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; background-color: #fff; padding: 10px; border: 1px solid #ddd;">
                        {reset_url}
                    </p>
                    <div class="warning">
                        <strong>Security Notice:</strong> This link will expire in 1 hour for your security.
                        If you didn't request a password reset, please ignore this email and your password 
                        will remain unchanged.
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {self.app_name}. All rights reserved.</p>
                    <p>This is an automated message, please do not reply to this email.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Hello {user_name},
        
        We received a request to reset your password for your {self.app_name} account.
        
        To reset your password, visit the following link:
        {reset_url}
        
        This link will expire in 1 hour for your security.
        
        If you didn't request a password reset, please ignore this email and your password will remain unchanged.
        
        Best regards,
        The {self.app_name} Team
        """
        
        return await self._send_email_async(to_email, subject, html_content, text_content)
    
    async def send_account_locked_email(
        self,
        to_email: str,
        user_name: str,
        locked_until: str,
        failed_attempts: int
    ) -> bool:
        """
        Send account locked notification.
        
        Args:
            to_email: Recipient email address
            user_name: User's name
            locked_until: Lock expiration time
            failed_attempts: Number of failed login attempts
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Security Alert: Your {self.app_name} account has been locked"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #DC3545; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .alert {{ background-color: #F8D7DA; border: 1px solid #DC3545; padding: 15px; 
                         border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Security Alert</h1>
                </div>
                <div class="content">
                    <h2>Hello, {user_name}</h2>
                    <div class="alert">
                        <strong>Your account has been temporarily locked</strong> due to 
                        {failed_attempts} failed login attempts.
                    </div>
                    <p>For your security, your account will be locked until: <strong>{locked_until}</strong></p>
                    <p>If this was you:</p>
                    <ul>
                        <li>Wait until the lock expires to try again</li>
                        <li>Use the "Forgot Password" option if you've forgotten your password</li>
                    </ul>
                    <p>If this wasn't you:</p>
                    <ul>
                        <li>Someone may be trying to access your account</li>
                        <li>Consider changing your password once the lock expires</li>
                        <li>Enable two-factor authentication for added security</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {self.app_name}. All rights reserved.</p>
                    <p>This is an automated security notification.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Security Alert for {user_name},
        
        Your {self.app_name} account has been temporarily locked due to {failed_attempts} failed login attempts.
        
        Your account will be locked until: {locked_until}
        
        If this was you, please wait until the lock expires or use the "Forgot Password" option.
        If this wasn't you, someone may be trying to access your account. Consider changing your password.
        
        Best regards,
        The {self.app_name} Security Team
        """
        
        return await self._send_email_async(to_email, subject, html_content, text_content)
    
    async def send_password_changed_email(
        self,
        to_email: str,
        user_name: str
    ) -> bool:
        """
        Send password changed notification.
        
        Args:
            to_email: Recipient email address
            user_name: User's name
            
        Returns:
            bool: True if email sent successfully
        """
        subject = f"Your {self.app_name} password has been changed"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #28A745; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9f9f9; padding: 30px; }}
                .info {{ background-color: #D4EDDA; border: 1px solid #28A745; padding: 15px; 
                        border-radius: 5px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Changed Successfully</h1>
                </div>
                <div class="content">
                    <h2>Hello, {user_name}</h2>
                    <div class="info">
                        <strong>Your password has been successfully changed.</strong>
                    </div>
                    <p>If you made this change, no further action is required.</p>
                    <p>If you didn't make this change:</p>
                    <ul>
                        <li>Your account may be compromised</li>
                        <li>Reset your password immediately</li>
                        <li>Review your account activity</li>
                        <li>Contact support if you need assistance</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>&copy; 2024 {self.app_name}. All rights reserved.</p>
                    <p>This is an automated security notification.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        text_content = f"""
        Hello {user_name},
        
        Your {self.app_name} password has been successfully changed.
        
        If you made this change, no further action is required.
        
        If you didn't make this change, your account may be compromised. 
        Please reset your password immediately and contact support.
        
        Best regards,
        The {self.app_name} Security Team
        """
        
        return await self._send_email_async(to_email, subject, html_content, text_content)


# Singleton instance
email_service = EmailService()