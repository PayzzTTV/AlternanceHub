CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'interested'
    CHECK (status IN ('interested','applied','followed_up','interview','accepted','rejected')),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_applications"
  ON applications FOR ALL
  USING (true)
  WITH CHECK (true);
