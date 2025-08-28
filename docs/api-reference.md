# API Reference

Complete API documentation for the Enterprise Authentication Template.

## Base URL

```
Development: http://localhost:8000/api/v1
Production: https://api.yourdomain.com/api/v1
```

## Authentication

The API uses JWT Bearer token authentication. Include the access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Authentication Endpoints

#### Register User

```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Login

```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Refresh Token

```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJ..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Logout

```http
POST /auth/logout
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Successfully logged out"
}
```

#### Get Current User

```http
GET /auth/me
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "full_name": "John Doe",
  "is_active": true,
  "is_verified": true,
  "is_superuser": false,
  "roles": [
    {
      "id": "uuid",
      "name": "user",
      "description": "Standard user role"
    }
  ],
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Update Profile

```http
PATCH /auth/me
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "first_name": "Jane",
  "last_name": "Smith"
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "Jane",
  "last_name": "Smith",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Change Password

```http
POST /auth/change-password
Authorization: Bearer <access_token>
```

**Request Body:**
```json
{
  "current_password": "OldPass123!",
  "new_password": "NewPass456!"
}
```

**Response (200):**
```json
{
  "message": "Password changed successfully"
}
```

#### Request Password Reset

```http
POST /auth/reset-password
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response (200):**
```json
{
  "message": "Password reset email sent"
}
```

#### Confirm Password Reset

```http
POST /auth/reset-password/confirm
```

**Request Body:**
```json
{
  "token": "reset-token",
  "new_password": "NewPass789!"
}
```

**Response (200):**
```json
{
  "message": "Password reset successfully"
}
```

#### Verify Email

```http
POST /auth/verify-email
```

**Request Body:**
```json
{
  "token": "verification-token"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully"
}
```

### OAuth Endpoints

#### Get OAuth Providers

```http
GET /auth/oauth/providers
```

**Response (200):**
```json
[
  {
    "id": "google",
    "name": "Google",
    "enabled": true
  },
  {
    "id": "github",
    "name": "GitHub",
    "enabled": true
  },
  {
    "id": "microsoft",
    "name": "Microsoft",
    "enabled": true
  }
]
```

#### Initiate OAuth Flow

```http
GET /auth/oauth/authorize?provider=google&redirect_uri=http://localhost:3000/auth/callback&state=random-state
```

**Response:** Redirect to OAuth provider

#### OAuth Callback

```http
POST /auth/oauth/callback
```

**Request Body:**
```json
{
  "code": "authorization-code",
  "state": "random-state",
  "redirect_uri": "http://localhost:3000/auth/callback"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

#### Link OAuth Account

```http
POST /auth/oauth/{provider}/link
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "authorize_url": "https://provider.com/oauth/authorize?..."
}
```

#### Unlink OAuth Account

```http
DELETE /auth/oauth/{provider}/unlink
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "message": "Account unlinked successfully"
}
```

#### Get Linked Accounts

```http
GET /auth/oauth/linked
Authorization: Bearer <access_token>
```

**Response (200):**
```json
[
  {
    "provider": "google",
    "provider_user_id": "123456",
    "linked_at": "2024-01-01T00:00:00Z"
  }
]
```

### User Management (Admin)

#### List Users

```http
GET /admin/users?page=1&limit=20&search=john
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "is_active": true,
      "is_verified": true,
      "roles": ["user"],
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 100,
  "page": 1,
  "pages": 5,
  "limit": 20
}
```

#### Get User Details

```http
GET /admin/users/{user_id}
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": true,
  "is_superuser": false,
  "roles": [
    {
      "id": "uuid",
      "name": "user",
      "permissions": ["read:profile", "update:profile"]
    }
  ],
  "sessions": [
    {
      "id": "uuid",
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2024-01-01T00:00:00Z",
      "last_activity": "2024-01-01T01:00:00Z"
    }
  ],
  "audit_logs": [
    {
      "action": "login",
      "timestamp": "2024-01-01T00:00:00Z",
      "ip_address": "192.168.1.1"
    }
  ]
}
```

#### Create User

```http
POST /admin/users
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "password": "TempPass123!",
  "first_name": "New",
  "last_name": "User",
  "roles": ["user"]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "email": "newuser@example.com",
  "first_name": "New",
  "last_name": "User",
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update User

```http
PUT /admin/users/{user_id}
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "is_active": false,
  "roles": ["user", "moderator"]
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "is_active": false,
  "roles": ["user", "moderator"],
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Delete User

```http
DELETE /admin/users/{user_id}
Authorization: Bearer <admin_token>
```

**Response (204):** No content

### Role & Permission Management

#### List Roles

```http
GET /admin/roles
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "admin",
    "description": "Administrator role",
    "permissions": [
      "users:read",
      "users:write",
      "users:delete",
      "roles:manage"
    ],
    "user_count": 5
  }
]
```

#### Create Role

```http
POST /admin/roles
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "name": "moderator",
  "description": "Content moderator",
  "permissions": [
    "content:read",
    "content:moderate",
    "users:read"
  ]
}
```

**Response (201):**
```json
{
  "id": "uuid",
  "name": "moderator",
  "description": "Content moderator",
  "permissions": ["content:read", "content:moderate", "users:read"],
  "created_at": "2024-01-01T00:00:00Z"
}
```

#### Update Role

```http
PUT /admin/roles/{role_id}
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "description": "Updated description",
  "permissions": ["content:read", "content:write"]
}
```

**Response (200):**
```json
{
  "id": "uuid",
  "name": "moderator",
  "description": "Updated description",
  "permissions": ["content:read", "content:write"],
  "updated_at": "2024-01-01T00:00:00Z"
}
```

#### Delete Role

```http
DELETE /admin/roles/{role_id}
Authorization: Bearer <admin_token>
```

**Response (204):** No content

#### List Permissions

```http
GET /admin/permissions
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
[
  {
    "resource": "users",
    "actions": ["read", "write", "delete"]
  },
  {
    "resource": "roles",
    "actions": ["read", "write", "delete", "manage"]
  },
  {
    "resource": "content",
    "actions": ["read", "write", "moderate", "delete"]
  }
]
```

### Audit Logs

#### Get Audit Logs

```http
GET /admin/audit-logs?user_id=uuid&action=login&start_date=2024-01-01&end_date=2024-01-31
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "action": "login",
      "resource": "auth",
      "details": {
        "ip_address": "192.168.1.1",
        "user_agent": "Mozilla/5.0..."
      },
      "timestamp": "2024-01-01T00:00:00Z"
    }
  ],
  "total": 500,
  "page": 1,
  "pages": 25
}
```

### System Settings

#### Get Settings

```http
GET /admin/settings
Authorization: Bearer <admin_token>
```

**Response (200):**
```json
{
  "security": {
    "max_login_attempts": 5,
    "lockout_duration_minutes": 30,
    "password_min_length": 8,
    "require_email_verification": true,
    "enable_2fa": true
  },
  "features": {
    "oauth_enabled": true,
    "magic_links_enabled": false,
    "user_registration_enabled": true
  },
  "email": {
    "smtp_configured": true,
    "from_email": "noreply@example.com",
    "from_name": "Enterprise Auth"
  }
}
```

#### Update Settings

```http
PATCH /admin/settings
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "security": {
    "max_login_attempts": 3,
    "enable_2fa": false
  }
}
```

**Response (200):**
```json
{
  "message": "Settings updated successfully",
  "updated_fields": ["security.max_login_attempts", "security.enable_2fa"]
}
```

## Error Responses

### Error Format

All errors follow this format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field": "Additional error details"
    }
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 422 | Validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

### Validation Errors

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": {
      "email": "Invalid email format",
      "password": "Password must be at least 8 characters"
    }
  }
}
```

## Rate Limiting

API endpoints are rate limited:

- **Authentication endpoints**: 5 requests per minute
- **Public endpoints**: 60 requests per minute
- **Authenticated endpoints**: 100 requests per minute
- **Admin endpoints**: 200 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Pagination

List endpoints support pagination:

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)
- `sort`: Sort field (e.g., `created_at`, `-created_at` for desc)
- `search`: Search query

**Response Format:**
```json
{
  "items": [...],
  "total": 1000,
  "page": 1,
  "pages": 50,
  "limit": 20,
  "has_next": true,
  "has_prev": false
}
```

## Webhooks

Configure webhooks for events:

```http
POST /admin/webhooks
Authorization: Bearer <admin_token>
```

**Request Body:**
```json
{
  "url": "https://your-app.com/webhook",
  "events": ["user.created", "user.login", "user.deleted"],
  "secret": "webhook-secret"
}
```

**Webhook Payload:**
```json
{
  "event": "user.created",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "user_id": "uuid",
    "email": "user@example.com"
  }
}
```

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Event:', data.type, data.payload);
};
```

**Event Types:**
- `user.updated`
- `session.created`
- `session.revoked`
- `notification`

## SDK Examples

### JavaScript/TypeScript

```typescript
import { AuthAPI } from '@enterprise/auth-sdk';

const api = new AuthAPI({
  baseURL: 'https://api.example.com',
  timeout: 30000,
});

// Login
const { access_token } = await api.auth.login({
  email: 'user@example.com',
  password: 'SecurePass123!',
});

// Set token
api.setAccessToken(access_token);

// Get current user
const user = await api.auth.getCurrentUser();
```

### Python

```python
from enterprise_auth import AuthClient

client = AuthClient(
    base_url="https://api.example.com",
    timeout=30
)

# Login
tokens = client.auth.login(
    email="user@example.com",
    password="SecurePass123!"
)

# Set token
client.set_access_token(tokens.access_token)

# Get current user
user = client.auth.get_current_user()
```

## Testing

Use the provided Postman collection or OpenAPI spec:

- [Postman Collection](../tools/postman-collection.json)
- [OpenAPI Specification](../tools/openapi.yaml)

Test endpoints with curl:

```bash
# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"SecurePass123!"}'

# Get current user
curl -X GET http://localhost:8000/api/v1/auth/me \
  -H "Authorization: Bearer <access_token>"
```

---

Last updated: January 2025