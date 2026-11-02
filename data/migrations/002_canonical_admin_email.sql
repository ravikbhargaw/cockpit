-- ========================================================
-- MEAVEN FOUNDER COCKPIT — MIGRATION 002
-- Canonical Admin Email & Session Security Hardening
-- Target Database: Neon PostgreSQL (https://cockpit.meaven.in)
--
-- Safety Guarantees:
-- 1. Idempotent: Can be run multiple times safely.
-- 2. Non-destructive: Does NOT drop, truncate, or overwrite business tables.
-- 3. Conflict Detection: Performs explicit pre-check to prevent email collisions.
-- 4. Preserves usr-1 identifier, ADMIN role, and associate usr-2 account.
-- ========================================================

DO $$
BEGIN
  -- 1. Ensure password_hash and session_version columns exist on users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'password_hash'
  ) THEN
    ALTER TABLE users ADD COLUMN password_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'session_version'
  ) THEN
    ALTER TABLE users ADD COLUMN session_version INTEGER DEFAULT 1;
  END IF;

  -- 2. Conflict-Checked Email Update for usr-1
  IF EXISTS (
    SELECT 1 FROM users 
    WHERE LOWER(email) = 'ravi.bhargaw@meaven.in' AND id != 'usr-1'
  ) THEN
    RAISE EXCEPTION 'MIGRATION ABORTED: Email ravi.bhargaw@meaven.in is already assigned to a different user record!';
  ELSE
    UPDATE users 
    SET 
      email = 'ravi.bhargaw@meaven.in',
      updated_at = NOW() 
    WHERE id = 'usr-1';
  END IF;

  -- 3. Ensure password_reset_tokens table exists with required constraints
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
  );

  -- 4. Indexes for Token Validation, Expiry Filtering, and User Association
  CREATE INDEX IF NOT EXISTS idx_reset_tokens_lookup 
  ON password_reset_tokens(token_hash, used_at, expires_at);

  CREATE INDEX IF NOT EXISTS idx_reset_tokens_user 
  ON password_reset_tokens(user_id);

END $$;

-- Verification Queries (Run immediately after migration)
-- SELECT id, name, email, role, session_version, (password_hash IS NOT NULL) AS has_password FROM users;
