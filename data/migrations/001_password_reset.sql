-- ==============================================================================
-- MEAVEN FOUNDER COCKPIT — ADDITIVE MIGRATION: PASSWORD RESET SCHEMA
-- Target Database: PostgreSQL 12+, Neon Serverless, Supabase, AWS RDS
-- Idempotency: Safe to run multiple times without altering existing data
-- ==============================================================================

-- 1. Ensure users table has password_hash and session_version columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS session_version INTEGER DEFAULT 1;

-- 2. Create password_reset_tokens table if missing
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL
);

-- 3. Create indexes for high-performance token validation, expiry filtering, and user association
CREATE INDEX IF NOT EXISTS idx_reset_tokens_lookup ON password_reset_tokens(token_hash, used_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);

-- ==============================================================================
-- VERIFICATION QUERY:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'password_reset_tokens';
-- ==============================================================================
