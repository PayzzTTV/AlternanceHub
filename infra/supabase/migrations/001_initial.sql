CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hash TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  location TEXT,
  contract_type TEXT DEFAULT 'alternance',
  duration TEXT,
  salary TEXT,
  tags TEXT[],
  source TEXT NOT NULL,
  source_url TEXT NOT NULL,
  published_at TIMESTAMPTZ,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS offers_scraped_at_idx ON offers (scraped_at DESC);
CREATE INDEX IF NOT EXISTS offers_tags_idx ON offers USING GIN (tags);
CREATE INDEX IF NOT EXISTS offers_source_idx ON offers (source);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS public_read_active_offers ON offers;
CREATE POLICY public_read_active_offers ON offers
  FOR SELECT
  USING (is_active = TRUE);
