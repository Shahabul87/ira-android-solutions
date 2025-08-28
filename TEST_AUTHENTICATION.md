# 🧪 Authentication System Testing Guide

This guide will help you manually test all authentication features of the Enterprise Auth Template.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)
- Postman or curl (for API testing)

---

## 🚀 Setup Instructions

### Step 1: Start the Services

```bash
# Navigate to project directory
cd enterprise-auth-template

# Start PostgreSQL and Redis
docker-compose up -d postgres redis

# Wait for services to be ready (about 10 seconds)
sleep 10

# Check if services are running
docker-compose ps
```

### Step 2: Start Backend

```bash
# In a new terminal
cd backend

# Create virtual environment (first time only)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements/dev.txt

# Run database migrations
alembic upgrade head

# Seed initial data (optional)
python -m app.core.seed_data

# Start the backend server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Step 3: Start Frontend

```bash
# In another terminal
cd frontend

# Install dependencies (first time only)
npm install

# Start the development server
npm run dev
```

### Step 4: Access Applications

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🧪 Test Scenarios

### 1. User Registration

#### Via Frontend UI:
1. Navigate to http://localhost:3000/auth/register
2. Fill in the form:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
   - First Name: `Test`
   - Last Name: `User`
3. Click "Register"
4. Check for success message

#### Via API (curl):
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!",
    "first_name": "Test",
    "last_name": "User"
  }'
```

#### Expected Result:
```json
{
  "id": "uuid-here",
  "email": "testuser@example.com",
  "first_name": "Test",
  "last_name": "User",
  "is_active": false,
  "is_verified": false,
  "created_at": "2024-01-20T..."
}
```

### 2. User Login

#### Via Frontend UI:
1. Navigate to http://localhost:3000/auth/login
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
3. Click "Login"
4. Should redirect to dashboard

#### Via API (curl):
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "TestPass123!"
  }'
```

#### Expected Result:
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid-here",
    "email": "testuser@example.com",
    "first_name": "Test",
    "last_name": "User",
    "roles": ["user"]
  }
}
```

### 3. Protected Route Access

#### With Valid Token:
```bash
# Save the access token from login
ACCESS_TOKEN="your-access-token-here"

# Access protected endpoint
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

#### Without Token:
```bash
curl -X GET http://localhost:8000/api/v1/users/me
```

Expected: 401 Unauthorized

### 4. Token Refresh

```bash
# Use refresh token from login
REFRESH_TOKEN="your-refresh-token-here"

curl -X POST http://localhost:8000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "'$REFRESH_TOKEN'"
  }'
```

### 5. Password Reset Flow

#### Request Reset:
```bash
curl -X POST http://localhost:8000/api/v1/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com"
  }'
```

#### Reset Password (with token from email):
```bash
curl -X POST http://localhost:8000/api/v1/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "reset-token-from-email",
    "new_password": "NewSecurePass456!"
  }'
```

### 6. Logout

```bash
curl -X POST http://localhost:8000/api/v1/auth/logout \
  -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 7. Rate Limiting Test

```bash
# Make multiple rapid requests to trigger rate limiting
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "wrong@example.com",
      "password": "wrong"
    }'
  echo ""
done
```

Expected: After 5 attempts, should receive 429 Too Many Requests

### 8. Account Lockout Test

```bash
# Make 5 failed login attempts
for i in {1..6}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{
      "email": "testuser@example.com",
      "password": "WrongPassword"
    }'
  echo ""
  sleep 1
done
```

Expected: Account should be locked after 5 failed attempts

---

## 🔍 Verify in Database

Connect to PostgreSQL to verify data:

```bash
# Connect to database
docker-compose exec postgres psql -U postgres -d auth_template_dev

# Check users table
SELECT id, email, is_active, is_verified, failed_login_attempts FROM users;

# Check sessions
SELECT * FROM user_sessions WHERE user_id = 'user-uuid-here';

# Check audit logs
SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;

# Exit
\q
```

---

## 🎯 Test Checklist

### Basic Authentication
- [ ] User can register with valid email/password
- [ ] Registration fails with invalid email format
- [ ] Registration fails with weak password
- [ ] User can login with correct credentials
- [ ] Login fails with incorrect credentials
- [ ] Access token is returned on successful login
- [ ] Refresh token works to get new access token

### Security Features
- [ ] Account locks after 5 failed login attempts
- [ ] Rate limiting triggers after threshold
- [ ] Passwords are hashed (check database)
- [ ] JWT tokens expire after set time
- [ ] Logout invalidates tokens

### Protected Routes
- [ ] Cannot access protected routes without token
- [ ] Can access protected routes with valid token
- [ ] Token in Authorization header works
- [ ] Expired token returns 401

### Password Management
- [ ] Password reset request sends email (if configured)
- [ ] Password reset with valid token works
- [ ] Password reset with invalid token fails
- [ ] Password strength validation works

### Frontend Integration
- [ ] Registration form works
- [ ] Login form works and redirects
- [ ] Protected pages redirect to login when not authenticated
- [ ] Logout clears session and redirects
- [ ] Error messages display correctly

---

## 🛠️ Troubleshooting

### Common Issues

#### 1. Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart if needed
docker-compose restart postgres
```

#### 2. Redis Connection Error
```bash
# Check Redis
docker-compose logs redis

# Test Redis connection
docker-compose exec redis redis-cli ping
```

#### 3. Migration Issues
```bash
# Reset database (WARNING: Deletes all data)
docker-compose exec backend alembic downgrade base
docker-compose exec backend alembic upgrade head
```

#### 4. Port Already in Use
```bash
# Find process using port 8000
lsof -i :8000

# Kill process
kill -9 <PID>
```

---

## 📊 Performance Testing

### Load Test with curl
```bash
# Simple load test
time for i in {1..100}; do
  curl -s -o /dev/null -w "%{http_code}\n" \
    http://localhost:8000/api/v1/health
done
```

### Check Response Times
```bash
curl -w "\n\nTime Details:\n\
  DNS Lookup: %{time_namelookup}s\n\
  Connect: %{time_connect}s\n\
  Start Transfer: %{time_starttransfer}s\n\
  Total: %{time_total}s\n" \
  -o /dev/null -s \
  http://localhost:8000/api/v1/health
```

---

## 🎉 Success Criteria

Your authentication system is working correctly if:

1. ✅ Users can register and receive confirmation
2. ✅ Users can login and receive JWT tokens
3. ✅ Protected routes require valid authentication
4. ✅ Tokens can be refreshed before expiry
5. ✅ Password reset flow works end-to-end
6. ✅ Rate limiting prevents brute force attacks
7. ✅ Account lockout prevents password guessing
8. ✅ All security headers are present
9. ✅ Passwords are properly hashed in database
10. ✅ Audit logs track authentication events

---

## 📝 Notes

- Default admin account (if seeded): `admin@example.com` / `SecurePass123!`
- Default user account (if seeded): `user@example.com` / `UserPass123!`
- Tokens expire in 30 minutes by default (configurable)
- Rate limits: 5 attempts per 5 minutes for auth endpoints
- Account locks for 30 minutes after 5 failed attempts

---

## 🔗 Useful Links

- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- pgAdmin: http://localhost:5050 (if enabled)
- Redis Commander: http://localhost:8081 (if enabled)

Happy Testing! 🚀