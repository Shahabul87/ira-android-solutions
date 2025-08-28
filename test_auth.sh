#!/bin/bash

# Authentication System Test Script
# This script tests all authentication endpoints

API_URL="http://localhost:8000/api/v1"
FRONTEND_URL="http://localhost:3000"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test user details
TEST_EMAIL="test_$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"
TEST_FIRST_NAME="Test"
TEST_LAST_NAME="User"

echo "========================================="
echo "     AUTHENTICATION SYSTEM TEST"
echo "========================================="
echo ""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# 1. Check if services are running
echo -e "${YELLOW}1. Checking Services...${NC}"
curl -s -f http://localhost:8000/health > /dev/null 2>&1
print_result $? "Backend API is running"

curl -s -f http://localhost:3000 > /dev/null 2>&1
print_result $? "Frontend is running"

echo ""

# 2. Test User Registration
echo -e "${YELLOW}2. Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\",
        \"first_name\": \"$TEST_FIRST_NAME\",
        \"last_name\": \"$TEST_LAST_NAME\"
    }")

if echo "$REGISTER_RESPONSE" | grep -q "\"id\""; then
    print_result 0 "User registration successful"
    USER_ID=$(echo "$REGISTER_RESPONSE" | grep -o '"id":"[^"]*' | cut -d'"' -f4)
    echo "  User ID: $USER_ID"
else
    print_result 1 "User registration failed"
    echo "  Response: $REGISTER_RESPONSE"
fi

echo ""

# 3. Test User Login
echo -e "${YELLOW}3. Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"$TEST_EMAIL\",
        \"password\": \"$TEST_PASSWORD\"
    }")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
    print_result 0 "User login successful"
    ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
    REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
    echo "  Access Token: ${ACCESS_TOKEN:0:20}..."
else
    print_result 1 "User login failed"
    echo "  Response: $LOGIN_RESPONSE"
fi

echo ""

# 4. Test Protected Route
echo -e "${YELLOW}4. Testing Protected Route Access...${NC}"
if [ ! -z "$ACCESS_TOKEN" ]; then
    ME_RESPONSE=$(curl -s -X GET $API_URL/users/me \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$ME_RESPONSE" | grep -q "\"email\""; then
        print_result 0 "Protected route accessible with token"
    else
        print_result 1 "Protected route access failed"
        echo "  Response: $ME_RESPONSE"
    fi
else
    echo "  Skipping - No access token available"
fi

# Test without token
UNAUTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X GET $API_URL/users/me)
if [ "$UNAUTH_RESPONSE" = "401" ]; then
    print_result 0 "Protected route blocked without token (401)"
else
    print_result 1 "Protected route not properly protected"
fi

echo ""

# 5. Test Token Refresh
echo -e "${YELLOW}5. Testing Token Refresh...${NC}"
if [ ! -z "$REFRESH_TOKEN" ]; then
    REFRESH_RESPONSE=$(curl -s -X POST $API_URL/auth/refresh \
        -H "Content-Type: application/json" \
        -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")
    
    if echo "$REFRESH_RESPONSE" | grep -q "access_token"; then
        print_result 0 "Token refresh successful"
        NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
        echo "  New Access Token: ${NEW_ACCESS_TOKEN:0:20}..."
    else
        print_result 1 "Token refresh failed"
        echo "  Response: $REFRESH_RESPONSE"
    fi
else
    echo "  Skipping - No refresh token available"
fi

echo ""

# 6. Test Password Reset Request
echo -e "${YELLOW}6. Testing Password Reset...${NC}"
RESET_RESPONSE=$(curl -s -X POST $API_URL/auth/forgot-password \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\"}")

if echo "$RESET_RESPONSE" | grep -q "message"; then
    print_result 0 "Password reset request sent"
else
    print_result 1 "Password reset request failed"
fi

echo ""

# 7. Test Rate Limiting
echo -e "${YELLOW}7. Testing Rate Limiting...${NC}"
echo "  Making rapid login attempts..."
RATE_LIMITED=false
for i in {1..10}; do
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login \
        -H "Content-Type: application/json" \
        -d "{\"email\": \"wrong@example.com\", \"password\": \"wrong\"}")
    
    if [ "$RESPONSE_CODE" = "429" ]; then
        RATE_LIMITED=true
        break
    fi
done

if [ "$RATE_LIMITED" = true ]; then
    print_result 0 "Rate limiting is working (429 received)"
else
    print_result 1 "Rate limiting not triggered"
fi

echo ""

# 8. Test Logout
echo -e "${YELLOW}8. Testing Logout...${NC}"
if [ ! -z "$ACCESS_TOKEN" ]; then
    LOGOUT_RESPONSE=$(curl -s -X POST $API_URL/auth/logout \
        -H "Authorization: Bearer $ACCESS_TOKEN")
    
    if echo "$LOGOUT_RESPONSE" | grep -q "success"; then
        print_result 0 "Logout successful"
    else
        print_result 1 "Logout failed"
    fi
else
    echo "  Skipping - No access token available"
fi

echo ""

# 9. Test Invalid Credentials
echo -e "${YELLOW}9. Testing Security Features...${NC}"
INVALID_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $API_URL/auth/login \
    -H "Content-Type: application/json" \
    -d "{\"email\": \"$TEST_EMAIL\", \"password\": \"WrongPassword\"}")

if [ "$INVALID_RESPONSE" = "401" ]; then
    print_result 0 "Invalid credentials rejected (401)"
else
    print_result 1 "Invalid credentials not properly handled"
fi

# Test weak password registration
WEAK_PASS_RESPONSE=$(curl -s -X POST $API_URL/auth/register \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"weak@example.com\",
        \"password\": \"weak\",
        \"first_name\": \"Weak\",
        \"last_name\": \"User\"
    }")

if echo "$WEAK_PASS_RESPONSE" | grep -q "error"; then
    print_result 0 "Weak password rejected"
else
    print_result 1 "Weak password not rejected"
fi

echo ""
echo "========================================="
echo "          TEST COMPLETE"
echo "========================================="
echo ""
echo "Test User: $TEST_EMAIL"
echo ""
echo "Next Steps:"
echo "1. Check http://localhost:8000/docs for API documentation"
echo "2. Try the frontend at http://localhost:3000"
echo "3. Check logs: docker-compose logs -f backend"
echo ""