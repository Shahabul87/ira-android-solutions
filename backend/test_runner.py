#!/usr/bin/env python3
"""
Simple test runner for authentication system verification.
Tests core functionality without external dependencies.
"""

import sys
import traceback
from datetime import timedelta

# Add current directory to path
sys.path.append('.')

# Import our modules
from app.core.security import (
    create_access_token,
    create_refresh_token,
    verify_token,
    get_password_hash,
    verify_password,
    is_password_strong,
    check_permission,
    has_role
)

def run_test(test_name: str, test_func):
    """Run a test function and report results."""
    try:
        test_func()
        print(f"✅ {test_name}")
        return True
    except Exception as e:
        print(f"❌ {test_name}: {e}")
        return False

def test_password_functionality():
    """Test password hashing and strength validation."""
    # Test password hashing
    password = "TestPassword123!"
    hashed = get_password_hash(password)
    assert hashed != password, "Hash should be different from password"
    assert verify_password(password, hashed), "Password should verify correctly"
    assert not verify_password("WrongPassword", hashed), "Wrong password should not verify"
    
    # Test password strength
    strong_password = "StrongPass123!"
    is_strong, issues = is_password_strong(strong_password)
    assert is_strong, f"Strong password should pass validation: {issues}"
    assert len(issues) == 0, "Strong password should have no issues"
    
    weak_password = "weak"
    is_weak, issues = is_password_strong(weak_password)
    assert not is_weak, "Weak password should fail validation"
    assert len(issues) > 0, "Weak password should have issues"

def test_jwt_tokens():
    """Test JWT token creation and verification."""
    user_id = "test-user-123"
    email = "test@example.com"
    roles = ["user", "moderator"]
    permissions = ["users:read", "content:create"]
    
    # Test access token
    access_token = create_access_token(
        user_id=user_id,
        email=email,
        roles=roles,
        permissions=permissions
    )
    assert isinstance(access_token, str), "Access token should be a string"
    assert len(access_token) > 50, "Access token should be substantial length"
    
    # Verify access token
    token_data = verify_token(access_token, "access")
    assert token_data is not None, "Token data should not be None"
    assert token_data.sub == user_id, "User ID should match"
    assert token_data.email == email, "Email should match"
    assert token_data.roles == roles, "Roles should match"
    assert token_data.permissions == permissions, "Permissions should match"
    assert token_data.token_type == "access", "Token type should be access"
    
    # Test refresh token
    refresh_token, token_id = create_refresh_token(user_id)
    assert isinstance(refresh_token, str), "Refresh token should be a string"
    assert isinstance(token_id, str), "Token ID should be a string"
    assert len(refresh_token) > 50, "Refresh token should be substantial length"
    assert len(token_id) > 20, "Token ID should be substantial length"
    
    # Verify refresh token
    refresh_data = verify_token(refresh_token, "refresh")
    assert refresh_data is not None, "Refresh token data should not be None"
    assert refresh_data.sub == user_id, "User ID should match"
    assert refresh_data.jti == token_id, "Token ID should match"
    assert refresh_data.token_type == "refresh", "Token type should be refresh"

def test_permission_system():
    """Test permission checking system."""
    user_permissions = [
        "users:read",
        "users:create",
        "content:*",
        "admin:settings"
    ]
    
    # Test specific permissions
    assert check_permission(user_permissions, "users:read"), "Should have users:read"
    assert check_permission(user_permissions, "users:create"), "Should have users:create"
    assert not check_permission(user_permissions, "users:delete"), "Should not have users:delete"
    
    # Test wildcard permissions
    assert check_permission(user_permissions, "content:read"), "Should have content:read via wildcard"
    assert check_permission(user_permissions, "content:create"), "Should have content:create via wildcard"
    assert check_permission(user_permissions, "content:delete"), "Should have content:delete via wildcard"
    
    # Test superuser permissions
    superuser_permissions = ["*:*"]
    assert check_permission(superuser_permissions, "anything:everything"), "Superuser should have all permissions"
    
    # Test role checking
    user_roles = ["user", "moderator"]
    assert has_role(user_roles, "user"), "Should have user role"
    assert has_role(user_roles, "moderator"), "Should have moderator role"
    assert not has_role(user_roles, "admin"), "Should not have admin role"

def test_token_expiration():
    """Test token expiration handling."""
    user_id = "test-user-123"
    email = "test@example.com"
    roles = ["user"]
    permissions = ["users:read"]
    
    # Create expired token
    expired_token = create_access_token(
        user_id=user_id,
        email=email,
        roles=roles,
        permissions=permissions,
        expires_delta=timedelta(seconds=-1)  # Already expired
    )
    
    # Verify expired token should return None
    token_data = verify_token(expired_token, "access")
    assert token_data is None, "Expired token should return None"

def test_invalid_tokens():
    """Test handling of invalid tokens."""
    # Test invalid token string
    assert verify_token("invalid-token", "access") is None, "Invalid token should return None"
    
    # Test empty token
    assert verify_token("", "access") is None, "Empty token should return None"
    
    # Test wrong token type
    user_id = "test-user-123"
    email = "test@example.com"
    roles = ["user"]
    permissions = ["users:read"]
    
    access_token = create_access_token(user_id, email, roles, permissions)
    
    # Try to verify access token as refresh token
    assert verify_token(access_token, "refresh") is None, "Wrong token type should return None"

def main():
    """Run all tests."""
    print("🧪 Running Enterprise Auth Template Test Suite")
    print("=" * 50)
    
    tests = [
        ("Password Functionality", test_password_functionality),
        ("JWT Token System", test_jwt_tokens),
        ("Permission System", test_permission_system),
        ("Token Expiration", test_token_expiration),
        ("Invalid Token Handling", test_invalid_tokens),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        if run_test(test_name, test_func):
            passed += 1
    
    print("\n" + "=" * 50)
    print(f"Tests Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Authentication system is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the implementation.")
        return 1

if __name__ == "__main__":
    sys.exit(main())