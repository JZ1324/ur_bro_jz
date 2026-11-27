-- Server-only schema: never expose garden_private through the Supabase Data API.
-- An administrator may pre-create this schema for a login that has CREATE only
-- inside garden_private, without database-wide schema creation privileges.
DO $$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_namespace WHERE nspname='garden_private') THEN
    CREATE SCHEMA garden_private;
  END IF;
END $$;
REVOKE ALL ON SCHEMA garden_private FROM PUBLIC;

CREATE TABLE IF NOT EXISTS garden_private.plantings (
  sequence BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  id TEXT NOT NULL UNIQUE, owner TEXT NOT NULL, category TEXT NOT NULL,
  payload TEXT NOT NULL, created_at BIGINT NOT NULL
);
CREATE INDEX IF NOT EXISTS plantings_category ON garden_private.plantings(category, sequence DESC);
CREATE INDEX IF NOT EXISTS plantings_owner ON garden_private.plantings(owner, created_at);
CREATE TABLE IF NOT EXISTS garden_private.publisher_limits (owner TEXT PRIMARY KEY, last_published_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS garden_private.removed_plantings (id TEXT PRIMARY KEY, owner TEXT NOT NULL, created_at BIGINT NOT NULL);
CREATE TABLE IF NOT EXISTS garden_private.garden_accounts (id TEXT PRIMARY KEY, name TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS garden_private.garden_sessions (token TEXT PRIMARY KEY, account TEXT NOT NULL, expires BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS sessions_expires ON garden_private.garden_sessions(expires);
CREATE TABLE IF NOT EXISTS garden_private.garden_auth_flows (
  state TEXT PRIMARY KEY, nonce TEXT NOT NULL, destination TEXT NOT NULL,
  expires BIGINT NOT NULL, email TEXT NOT NULL DEFAULT '', attempts INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS auth_flows_expires ON garden_private.garden_auth_flows(expires);
CREATE TABLE IF NOT EXISTS garden_private.account_oceans (account TEXT PRIMARY KEY, payload TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS garden_private.account_catches (account TEXT NOT NULL, event TEXT NOT NULL, request TEXT NOT NULL, fish TEXT NOT NULL, PRIMARY KEY(account,event));
CREATE TABLE IF NOT EXISTS garden_private.guest_imports (id TEXT PRIMARY KEY, account TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS garden_private.account_keepsakes (account TEXT NOT NULL, id TEXT NOT NULL, payload TEXT NOT NULL, PRIMARY KEY(account,id));
CREATE TABLE IF NOT EXISTS garden_private.rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, expires BIGINT NOT NULL);
CREATE INDEX IF NOT EXISTS rate_limits_expires ON garden_private.rate_limits(expires);

-- Defense in depth: only the trusted database server role may operate these tables.
ALTER TABLE garden_private.plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.publisher_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.removed_plantings ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.garden_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.garden_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.garden_auth_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.account_oceans ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.account_catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.guest_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.account_keepsakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE garden_private.rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON ALL TABLES IN SCHEMA garden_private FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA garden_private FROM PUBLIC;
-- These roles exist on Supabase, but may not exist in local PostgreSQL test runners.
DO $$ BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='anon') THEN
    REVOKE ALL ON SCHEMA garden_private FROM anon;
    REVOKE ALL ON ALL TABLES IN SCHEMA garden_private FROM anon;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA garden_private FROM anon;
  END IF;
  IF EXISTS (SELECT FROM pg_roles WHERE rolname='authenticated') THEN
    REVOKE ALL ON SCHEMA garden_private FROM authenticated;
    REVOKE ALL ON ALL TABLES IN SCHEMA garden_private FROM authenticated;
    REVOKE ALL ON ALL SEQUENCES IN SCHEMA garden_private FROM authenticated;
  END IF;
END $$;
