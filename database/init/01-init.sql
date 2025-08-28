-- Database initialization script for Enterprise Auth Template
-- Creates necessary extensions and initial setup

-- Enable required PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "citext";

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS auth;
CREATE SCHEMA IF NOT EXISTS audit;

-- Set default privileges
ALTER DEFAULT PRIVILEGES IN SCHEMA auth GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO enterprise_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit GRANT SELECT, INSERT ON TABLES TO enterprise_user;

-- Create indexes for common queries (will be created by Alembic migrations)
-- These are just placeholders to show what indexes would be beneficial

-- User table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON auth.users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_is_active ON auth.users(is_active);
-- CREATE INDEX IF NOT EXISTS idx_users_created_at ON auth.users(created_at);

-- Session table indexes
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON auth.user_sessions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON auth.user_sessions(expires_at);
-- CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON auth.user_sessions(session_token);

-- Audit log indexes
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit.audit_logs(user_id);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit.audit_logs(action);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit.audit_logs(created_at);
-- CREATE INDEX IF NOT EXISTS idx_audit_logs_resource_type ON audit.audit_logs(resource_type);

-- Role and permission indexes
-- CREATE INDEX IF NOT EXISTS idx_roles_name ON auth.roles(name);
-- CREATE INDEX IF NOT EXISTS idx_permissions_resource_action ON auth.permissions(resource, action);

-- Create a function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a function for generating secure random tokens
CREATE OR REPLACE FUNCTION generate_random_token(length INTEGER DEFAULT 32)
RETURNS TEXT AS $$
BEGIN
    RETURN encode(gen_random_bytes(length), 'hex');
END;
$$ language 'plpgsql';

-- Create a function for checking password strength
CREATE OR REPLACE FUNCTION is_strong_password(password TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check minimum length (8 characters)
    IF char_length(password) < 8 THEN
        RETURN FALSE;
    END IF;
    
    -- Check for uppercase letter
    IF password !~ '[A-Z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for lowercase letter
    IF password !~ '[a-z]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for digit
    IF password !~ '[0-9]' THEN
        RETURN FALSE;
    END IF;
    
    -- Check for special character
    IF password !~ '[^A-Za-z0-9]' THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ language 'plpgsql';

-- Grant necessary permissions to the application user
GRANT USAGE ON SCHEMA auth TO enterprise_user;
GRANT USAGE ON SCHEMA audit TO enterprise_user;
GRANT EXECUTE ON FUNCTION update_updated_at_column() TO enterprise_user;
GRANT EXECUTE ON FUNCTION generate_random_token(INTEGER) TO enterprise_user;
GRANT EXECUTE ON FUNCTION is_strong_password(TEXT) TO enterprise_user;

-- Create a view for user statistics (will be useful for admin dashboard)
-- This will be created after tables exist via migrations