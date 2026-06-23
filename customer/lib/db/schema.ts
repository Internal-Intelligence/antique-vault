/** Inline schema for serverless — avoids fs reads at runtime. */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS intake_tickets (
  id TEXT PRIMARY KEY,
  wallet_pubkey TEXT,
  sell_mode TEXT NOT NULL DEFAULT 'intake',
  device_name TEXT NOT NULL,
  category TEXT NOT NULL,
  condition_tier INT NOT NULL DEFAULT 3,
  is_working BOOLEAN NOT NULL DEFAULT true,
  weight_lbs TEXT,
  description TEXT,
  offer_usd_cents INT NOT NULL DEFAULT 0,
  ship_from_address TEXT,
  warehouse_address TEXT NOT NULL DEFAULT 'NFTBAY Verification Hub, Austin TX 78701',
  tracking_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  nft_mint TEXT,
  form_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_wallet ON intake_tickets(wallet_pubkey);
CREATE INDEX IF NOT EXISTS idx_intake_status ON intake_tickets(status);

CREATE TABLE IF NOT EXISTS shipments (
  id TEXT PRIMARY KEY,
  intake_id TEXT REFERENCES intake_tickets(id) ON DELETE SET NULL,
  wallet_pubkey TEXT,
  carrier TEXT,
  tracking TEXT,
  label_url TEXT,
  status TEXT NOT NULL DEFAULT 'label_created',
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shipments_intake ON shipments(intake_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking);

CREATE TABLE IF NOT EXISTS valuations (
  id TEXT PRIMARY KEY,
  intake_id TEXT REFERENCES intake_tickets(id) ON DELETE SET NULL,
  wallet_pubkey TEXT,
  form_json JSONB NOT NULL,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verify_sessions (
  id TEXT PRIMARY KEY,
  wallet_pubkey TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'persona',
  external_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  trust_score INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verify_wallet ON verify_sessions(wallet_pubkey);

CREATE TABLE IF NOT EXISTS activity_events (
  id TEXT PRIMARY KEY,
  wallet_pubkey TEXT NOT NULL,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  meta TEXT,
  value_text TEXT,
  ref_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_wallet ON activity_events(wallet_pubkey, created_at DESC);

CREATE TABLE IF NOT EXISTS warehouse_items (
  item_id TEXT PRIMARY KEY,
  nft_mint TEXT,
  name TEXT,
  category TEXT,
  condition_grade INT,
  status TEXT NOT NULL DEFAULT 'intake',
  photos JSONB NOT NULL DEFAULT '[]'::jsonb,
  q_hash TEXT,
  paperwork_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warehouse_mint ON warehouse_items(nft_mint);

CREATE TABLE IF NOT EXISTS fee_allocations (
  id TEXT PRIMARY KEY,
  period_label TEXT NOT NULL,
  pool_type TEXT NOT NULL,
  amount_lamports BIGINT NOT NULL DEFAULT 0,
  pct INT NOT NULL DEFAULT 0,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS listings_cache (
  id TEXT PRIMARY KEY DEFAULT 'marketplace',
  payload JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stripe_checkouts (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE,
  wallet_pubkey TEXT,
  nft_mint TEXT,
  listing_mode TEXT,
  amount_cents INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cron_runs (
  id TEXT PRIMARY KEY,
  job_name TEXT NOT NULL,
  result_json JSONB NOT NULL,
  ran_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_job ON cron_runs(job_name, ran_at DESC);
`;