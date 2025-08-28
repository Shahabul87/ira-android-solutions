#!/usr/bin/env python3
"""Quick seed script to create basic roles"""

import psycopg2
from datetime import datetime
import uuid

# Database connection
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    database="enterprise_auth",
    user="enterprise_user",
    password="enterprise_password_2024"
)
cursor = conn.cursor()

try:
    # Create user role
    user_role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
    """, (user_role_id, 'user', 'Regular user with basic access', True, datetime.utcnow(), datetime.utcnow()))
    
    # Create admin role
    admin_role_id = str(uuid.uuid4())
    cursor.execute("""
        INSERT INTO roles (id, name, description, is_system, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s)
        ON CONFLICT (name) DO NOTHING
    """, (admin_role_id, 'admin', 'Administrator with full access', True, datetime.utcnow(), datetime.utcnow()))
    
    conn.commit()
    print("Roles created successfully!")
    
    # Show created roles
    cursor.execute("SELECT name, description FROM roles")
    roles = cursor.fetchall()
    print("\nCreated roles:")
    for role in roles:
        print(f"  - {role[0]}: {role[1]}")
        
except Exception as e:
    print(f"Error: {e}")
    conn.rollback()
finally:
    cursor.close()
    conn.close()