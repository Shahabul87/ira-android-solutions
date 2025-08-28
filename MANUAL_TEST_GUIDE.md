# 🧪 Manual Authentication Testing Guide

## ✅ Current Status

### Services Running:
- **PostgreSQL**: ✅ Running on port 5432
- **Redis**: ✅ Running on port 6379  
- **Backend**: 🔄 Restarting (fixing dependencies)
- **Frontend**: ✅ Building/Starting on port 3000

---

## 🚀 Quick Start Testing

### Step 1: Ensure Services Are Running

```bash
# Check service status
docker-compose ps

# If not running, start them:
docker-compose up -d
```

### Step 2: Wait for Services to Start
- Backend takes ~30 seconds
- Frontend takes ~20 seconds

### Step 3: Access the Applications

#### 🌐 **Frontend UI Testing**
1. Open browser: http://localhost:3000
2. You should see the landing page
3. Click "Get Started" or "Login"

#### 📚 **API Documentation**
1. Open browser: http://localhost:8000/docs
2. Interactive Swagger UI for testing endpoints
3. Alternative: http://localhost:8000/redoc

---

## 🧪 Test Scenarios

### Test 1: User Registration (Frontend)

1. Navigate to: http://localhost:3000/auth/register
2. Fill in the form:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
   - First Name: `John`
   - Last Name: `Doe`
3. Click "Register"
4. **Expected**: Success message or redirect to login

### Test 2: User Registration (API)

Open terminal and run:

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "SecurePass123!",
    "first_name": "API",
    "last_name": "Test"
  }'
```

**Expected Response:**
```json
{
  "id": "uuid-here",
  "email": "apitest@example.com",
  "first_name": "API",
  "last_name": "Test",
  "is_active": false,
  "is_verified": false
}
```

### Test 3: User Login (Frontend)

1. Navigate to: http://localhost:3000/auth/login
2. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `TestPass123!`
3. Click "Login"
4. **Expected**: Redirect to dashboard

### Test 4: User Login (API)

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "apitest@example.com",
    "password": "SecurePass123!"
  }'
```

**Expected Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 1800,
  "user": {
    "id": "uuid",
    "email": "apitest@example.com",
    "roles": ["user"]
  }
}
```

### Test 5: Access Protected Route

Using the token from login:

```bash
# Replace YOUR_TOKEN with actual token from login
curl -X GET http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected**: User profile data

### Test 6: Test Rate Limiting

Make multiple rapid requests:

```bash
for i in {1..10}; do
  curl -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email": "wrong@example.com", "password": "wrong"}'
  echo ""
done
```

**Expected**: After 5 attempts, receive `429 Too Many Requests`

---

## 🔍 Verification Steps

### Check Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d auth_template_dev

# View users
SELECT id, email, is_active, is_verified FROM users;

# Exit
\q
```

### Check Logs

```bash
# Backend logs
docker-compose logs -f backend

# Frontend logs  
docker-compose logs -f frontend

# All services
docker-compose logs -f
```

---

## ✅ Success Checklist

- [ ] Frontend loads at http://localhost:3000
- [ ] API docs available at http://localhost:8000/docs
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Receive JWT tokens on login
- [ ] Can access protected routes with token
- [ ] Rate limiting works (429 after threshold)
- [ ] Passwords are hashed in database
- [ ] Account locks after failed attempts

---

## 🛠️ Troubleshooting

### Backend Not Starting
```bash
# Check logs
docker-compose logs backend

# Rebuild if needed
docker-compose build backend
docker-compose up -d backend
```

### Frontend Not Loading
```bash
# Check logs
docker-compose logs frontend

# Rebuild
docker-compose build frontend
docker-compose up -d frontend
```

### Database Connection Issues
```bash
# Restart database
docker-compose restart postgres

# Check connection
docker-compose exec postgres pg_isready
```

### Port Already in Use
```bash
# Find process using port
lsof -i :8000  # or :3000

# Kill process
kill -9 <PID>
```

---

## 🎯 Next Steps

Once basic authentication works:

1. **Test OAuth Login** (if configured)
2. **Test Password Reset Flow**
3. **Test Email Verification**
4. **Test Admin Panel** at http://localhost:3000/admin
5. **Test Session Management**
6. **Test Account Security Features**

---

## 📝 Notes

- Default admin account: `admin@example.com` / `SecurePass123!` (if seeded)
- Tokens expire in 30 minutes by default
- Rate limits: 5 login attempts per 5 minutes
- Account locks for 30 minutes after 5 failed attempts

---

## 🎉 Testing Complete!

If all tests pass, your authentication system is working correctly and ready for customization!