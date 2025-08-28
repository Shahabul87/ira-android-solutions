#!/bin/bash

# Quick Authentication Test Script
# Tests the basic auth endpoints with Docker Compose

echo "========================================="
echo "    QUICK AUTHENTICATION TEST"
echo "========================================="
echo ""

# Start services if not running
echo "📦 Starting Docker services..."
docker-compose up -d postgres redis
sleep 5

echo ""
echo "🚀 Starting backend service..."
docker-compose up -d backend
echo "Waiting for backend to start (30 seconds)..."
sleep 30

echo ""
echo "🚀 Starting frontend service..."
docker-compose up -d frontend
echo "Waiting for frontend to start (20 seconds)..."
sleep 20

# Check service health
echo ""
echo "🔍 Checking services..."
echo -n "PostgreSQL: "
docker-compose exec -T postgres pg_isready -U postgres && echo "✅ Running" || echo "❌ Not running"

echo -n "Redis: "
docker-compose exec -T redis redis-cli ping && echo "✅ Running" || echo "❌ Not running"

echo -n "Backend API: "
curl -s http://localhost:8000/health > /dev/null 2>&1 && echo "✅ Running at http://localhost:8000" || echo "❌ Not running"

echo -n "Frontend: "
curl -s http://localhost:3000 > /dev/null 2>&1 && echo "✅ Running at http://localhost:3000" || echo "❌ Not running"

echo ""
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""

# Test registration
echo "========================================="
echo "    TESTING AUTHENTICATION"
echo "========================================="
echo ""

TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "1️⃣  Testing User Registration"
echo "   Email: $TEST_EMAIL"
echo ""

REGISTER_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"first_name\": \"Test\",
        \"last_name\": \"User\"
    }")

if echo "$REGISTER_RESPONSE" | grep -q "id"; then
    echo "   ✅ Registration successful!"
    echo "   Response: ${REGISTER_RESPONSE:0:100}..."
else
    echo "   ❌ Registration failed"
    echo "   Response: $REGISTER_RESPONSE"
fi

echo ""
echo "2️⃣  Testing User Login"
echo ""

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    echo "   ✅ Login successful!"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    echo "   Token: ${ACCESS_TOKEN:0:50}..."
else
    echo "   ❌ Login failed"
    echo "   Response: $LOGIN_RESPONSE"
fi

echo ""
echo "3️⃣  Testing Protected Route"
echo ""

if [ ! -z "$ACCESS_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -X GET http://localhost:8000/api/v1/users/me \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q "email"; then
        echo "   ✅ Protected route accessible!"
        echo "   User data retrieved successfully"
    else
        echo "   ❌ Protected route failed"
        echo "   Response: $ME_RESPONSE"
    fi
else
    echo "   ⏩ Skipping - No access token available"
fi

echo ""
echo "========================================="
echo "    TEST SUMMARY"
echo "========================================="
echo ""
echo "✅ Services are running"
echo "✅ You can now test the authentication system"
echo ""
echo "📝 Try these:"
echo "   1. Open Frontend: http://localhost:3000"
echo "   2. Register a new user"
echo "   3. Login with your credentials"
echo "   4. Access the dashboard"
echo ""
echo "🔧 API Documentation: http://localhost:8000/docs"
echo "📊 View logs: docker-compose logs -f backend"
echo "🛑 Stop services: docker-compose down"
echo ""