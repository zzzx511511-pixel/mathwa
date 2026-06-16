-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- Creates the place_visits table for tracking page visits

CREATE TABLE IF NOT EXISTS place_visits (
  id         BIGSERIAL PRIMARY KEY,
  place_id   TEXT NOT NULL,
  visited_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_place_visits_place_id   ON place_visits (place_id);
CREATE INDEX IF NOT EXISTS idx_place_visits_visited_at ON place_visits (visited_at);

-- Optional: enable Row Level Security (allow only service role to insert/read)
ALTER TABLE place_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_all" ON place_visits
  FOR ALL USING (auth.role() = 'service_role');
