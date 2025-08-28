# Security Best Practices

This document outlines security best practices for deploying and maintaining the Enterprise Authentication Template.

## Table of Contents

1. [Authentication Security](#authentication-security)
2. [Password Security](#password-security)
3. [Token Management](#token-management)
4. [API Security](#api-security)
5. [Database Security](#database-security)
6. [Infrastructure Security](#infrastructure-security)
7. [OWASP Top 10 Protection](#owasp-top-10-protection)
8. [Compliance & Auditing](#compliance--auditing)
9. [Incident Response](#incident-response)

## Authentication Security

### Multi-Factor Authentication (MFA)

**Implementation:**
```python
# Enable 2FA for all admin accounts
REQUIRE_2FA_FOR_ADMIN = True
TOTP_ISSUER = "Enterprise Auth"
TOTP_VALIDITY_WINDOW = 1  # Accept codes ±1 time step
```

**Best Practices:**
- Enforce 2FA for privileged accounts
- Support backup codes for account recovery
- Use time-based OTP (TOTP) over SMS
- Implement rate limiting on 2FA attempts

### OAuth Security

**Configuration:**
```python
# OAuth security settings
OAUTH_STATE_LENGTH = 32  # Minimum state parameter length
OAUTH_STATE_TIMEOUT = 600  # State validity in seconds
OAUTH_PKCE_REQUIRED = True  # Require PKCE for public clients
```

**Best Practices:**
- Always validate OAuth state parameter
- Implement PKCE for public clients
- Validate redirect URIs strictly
- Store OAuth tokens encrypted

### Session Management

**Configuration:**
```python
# Session security
SESSION_COOKIE_SECURE = True  # HTTPS only
SESSION_COOKIE_HTTPONLY = True  # No JavaScript access
SESSION_COOKIE_SAMESITE = "Strict"  # CSRF protection
SESSION_TIMEOUT = 3600  # 1 hour idle timeout
SESSION_ABSOLUTE_TIMEOUT = 86400  # 24 hour absolute timeout
```

**Best Practices:**
- Regenerate session ID on login
- Implement idle and absolute timeouts
- Clear sessions on logout
- Monitor concurrent sessions

## Password Security

### Password Policy

**Requirements:**
```python
PASSWORD_POLICY = {
    "min_length": 12,
    "require_uppercase": True,
    "require_lowercase": True,
    "require_numbers": True,
    "require_special": True,
    "special_chars": "!@#$%^&*()_+-=[]{}|;:,.<>?",
    "dictionary_check": True,
    "common_passwords_check": True,
    "previous_passwords": 5,  # Remember last 5 passwords
    "max_age_days": 90,  # Force reset every 90 days
}
```

### Password Storage

**Implementation:**
```python
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Increase for more security
)

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
```

### Account Lockout

**Configuration:**
```python
LOCKOUT_POLICY = {
    "max_attempts": 5,
    "lockout_duration": 1800,  # 30 minutes
    "reset_attempts_after": 3600,  # 1 hour
    "permanent_lockout_threshold": 10,
    "captcha_after_attempts": 3,
}
```

## Token Management

### JWT Security

**Configuration:**
```python
JWT_CONFIG = {
    "algorithm": "RS256",  # Use RSA for production
    "access_token_expire": 900,  # 15 minutes
    "refresh_token_expire": 604800,  # 7 days
    "refresh_token_rotate": True,  # Rotate on use
    "blacklist_enabled": True,  # Track revoked tokens
    "audience": "enterprise-auth-api",
    "issuer": "https://auth.yourdomain.com",
}
```

### Token Storage

**Frontend Best Practices:**
```typescript
// Store tokens securely
class TokenStorage {
  // Use httpOnly cookies for refresh tokens
  setRefreshToken(token: string) {
    // Set via backend with httpOnly flag
  }
  
  // Store access token in memory only
  private accessToken: string | null = null;
  
  setAccessToken(token: string) {
    this.accessToken = token;
  }
  
  // Never store tokens in localStorage for production
}
```

### Token Rotation

**Implementation:**
```python
async def refresh_access_token(refresh_token: str):
    # Validate refresh token
    payload = verify_token(refresh_token)
    
    # Check if token is blacklisted
    if is_blacklisted(refresh_token):
        raise SecurityError("Token revoked")
    
    # Issue new tokens
    new_access = create_access_token(user_id=payload["sub"])
    new_refresh = create_refresh_token(user_id=payload["sub"])
    
    # Blacklist old refresh token
    blacklist_token(refresh_token)
    
    return new_access, new_refresh
```

## API Security

### Rate Limiting

**Configuration:**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100 per minute"],
    storage_uri="redis://localhost:6379"
)

# Endpoint-specific limits
@app.post("/api/v1/auth/login")
@limiter.limit("5 per minute")
async def login():
    pass
```

### Input Validation

**Implementation:**
```python
from pydantic import BaseModel, validator, constr, EmailStr
import bleach

class UserInput(BaseModel):
    email: EmailStr
    name: constr(min_length=1, max_length=100)
    bio: str
    
    @validator("bio")
    def sanitize_bio(cls, v):
        # Remove dangerous HTML
        return bleach.clean(v, tags=[], strip=True)
    
    @validator("name")
    def validate_name(cls, v):
        # Prevent SQL injection attempts
        forbidden = ["'", '"', ";", "--", "/*", "*/"]
        for char in forbidden:
            if char in v:
                raise ValueError("Invalid character in name")
        return v
```

### CORS Configuration

**Secure CORS Setup:**
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://app.yourdomain.com",
        "https://admin.yourdomain.com"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"],
    max_age=86400,  # Cache preflight for 24 hours
)
```

### Security Headers

**Implementation:**
```python
from fastapi import Response

@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    
    # Security headers
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "font-src 'self' data:; "
        "connect-src 'self' https://api.yourdomain.com"
    )
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Permissions-Policy"] = (
        "geolocation=(), microphone=(), camera=()"
    )
    
    return response
```

## Database Security

### Connection Security

**Configuration:**
```python
# Use SSL for database connections
DATABASE_URL = "postgresql://user:pass@host:5432/db?sslmode=require"

# Connection pool settings
SQLALCHEMY_ENGINE_OPTIONS = {
    "pool_size": 20,
    "max_overflow": 40,
    "pool_pre_ping": True,  # Verify connections
    "pool_recycle": 3600,  # Recycle connections hourly
    "connect_args": {
        "sslmode": "require",
        "sslcert": "/path/to/client-cert.pem",
        "sslkey": "/path/to/client-key.pem",
        "sslrootcert": "/path/to/ca-cert.pem"
    }
}
```

### Query Security

**Parameterized Queries:**
```python
from sqlalchemy import text

# NEVER do this
query = f"SELECT * FROM users WHERE email = '{email}'"

# ALWAYS use parameterized queries
query = text("SELECT * FROM users WHERE email = :email")
result = db.execute(query, {"email": email})
```

### Data Encryption

**Encrypt Sensitive Data:**
```python
from cryptography.fernet import Fernet

class EncryptedField:
    def __init__(self, key: bytes):
        self.cipher = Fernet(key)
    
    def encrypt(self, value: str) -> bytes:
        return self.cipher.encrypt(value.encode())
    
    def decrypt(self, value: bytes) -> str:
        return self.cipher.decrypt(value).decode()

# Use for sensitive fields
encrypted_field = EncryptedField(settings.ENCRYPTION_KEY)
user.ssn = encrypted_field.encrypt(ssn_value)
```

## Infrastructure Security

### Docker Security

**Dockerfile Best Practices:**
```dockerfile
# Use specific version tags
FROM python:3.11-slim-bullseye

# Run as non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Copy only necessary files
COPY --chown=appuser:appuser requirements.txt .
COPY --chown=appuser:appuser app/ ./app/

# Security scanning
RUN pip install --no-cache-dir safety && \
    safety check --json
```

### Environment Variables

**Secure Secrets Management:**
```bash
# Use secret management service
aws secretsmanager get-secret-value --secret-id prod/auth/db

# Or use encrypted environment files
openssl enc -aes-256-cbc -salt -in .env -out .env.enc

# Kubernetes secrets
kubectl create secret generic auth-secrets \
  --from-literal=db-password='...' \
  --from-literal=jwt-secret='...'
```

### Network Security

**Configuration:**
```yaml
# docker-compose.yml
services:
  backend:
    networks:
      - backend-net
    expose:
      - "8000"  # Internal only
  
  nginx:
    networks:
      - backend-net
      - frontend-net
    ports:
      - "443:443"  # Public HTTPS only

networks:
  backend-net:
    internal: true  # No external access
  frontend-net:
    driver: bridge
```

## OWASP Top 10 Protection

### 1. Injection
- Use parameterized queries
- Validate all inputs
- Use ORMs properly
- Escape special characters

### 2. Broken Authentication
- Implement MFA
- Use secure session management
- Enforce strong passwords
- Implement account lockout

### 3. Sensitive Data Exposure
- Use HTTPS everywhere
- Encrypt sensitive data at rest
- Don't log sensitive information
- Implement proper key management

### 4. XML External Entities (XXE)
- Disable XML external entity processing
- Use JSON instead of XML
- Validate XML schemas

### 5. Broken Access Control
- Implement RBAC
- Verify permissions on every request
- Use principle of least privilege
- Log access control failures

### 6. Security Misconfiguration
- Remove default accounts
- Disable unnecessary features
- Keep software updated
- Use security headers

### 7. Cross-Site Scripting (XSS)
- Sanitize all user inputs
- Use CSP headers
- Escape output properly
- Use template engines safely

### 8. Insecure Deserialization
- Validate serialized data
- Use simple data formats
- Implement integrity checks
- Isolate deserialization

### 9. Using Components with Known Vulnerabilities
- Keep dependencies updated
- Monitor security advisories
- Use dependency scanning
- Implement security patches quickly

### 10. Insufficient Logging & Monitoring
- Log security events
- Monitor for anomalies
- Implement alerting
- Regular security audits

## Compliance & Auditing

### Audit Logging

**Implementation:**
```python
import json
from datetime import datetime

class AuditLogger:
    def log_event(self, user_id: str, action: str, resource: str, details: dict):
        audit_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "user_id": user_id,
            "action": action,
            "resource": resource,
            "details": details,
            "ip_address": get_client_ip(),
            "user_agent": get_user_agent(),
        }
        
        # Store in database
        db.audit_logs.insert(audit_entry)
        
        # Send to SIEM
        send_to_siem(audit_entry)
```

### Compliance Checks

**GDPR Compliance:**
- Right to be forgotten
- Data portability
- Consent management
- Privacy by design

**HIPAA Compliance:**
- Encryption at rest and in transit
- Access controls
- Audit logging
- Business Associate Agreements

## Incident Response

### Response Plan

1. **Detection**
   - Monitor logs for anomalies
   - Set up alerts for suspicious activity
   - Regular security scans

2. **Containment**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block malicious IPs

3. **Eradication**
   - Remove malware/backdoors
   - Patch vulnerabilities
   - Update security rules

4. **Recovery**
   - Restore from clean backups
   - Reset all credentials
   - Verify system integrity

5. **Lessons Learned**
   - Document incident
   - Update security procedures
   - Train team on findings

### Emergency Contacts

```yaml
security_team:
  - name: Security Lead
    phone: +1-xxx-xxx-xxxx
    email: security@company.com
  
  - name: DevOps Lead
    phone: +1-xxx-xxx-xxxx
    email: devops@company.com

external_contacts:
  - service: AWS Support
    phone: +1-xxx-xxx-xxxx
  - service: CloudFlare
    phone: +1-xxx-xxx-xxxx
```

## Security Checklist

### Pre-Deployment
- [ ] Change all default passwords
- [ ] Generate new secret keys
- [ ] Configure HTTPS/TLS
- [ ] Set up firewall rules
- [ ] Enable security headers
- [ ] Configure rate limiting
- [ ] Set up monitoring/alerting
- [ ] Review CORS settings
- [ ] Enable audit logging
- [ ] Backup configuration

### Post-Deployment
- [ ] Run security scan
- [ ] Test authentication flows
- [ ] Verify rate limiting
- [ ] Check SSL configuration
- [ ] Review access logs
- [ ] Test backup recovery
- [ ] Schedule security updates
- [ ] Document security procedures

---

Last updated: January 2025
Security Contact: security@yourdomain.com