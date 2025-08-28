#!/usr/bin/env python3
"""Test password hashing"""

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "TestPassword123!"
hashed = pwd_context.hash(password)
print(f"Password: {password}")
print(f"Hashed: {hashed}")
print(f"Verify: {pwd_context.verify(password, hashed)}")