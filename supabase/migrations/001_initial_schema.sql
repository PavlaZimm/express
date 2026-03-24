-- ============================================================
-- Fleet Management Dashboard - Initial Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- vehicles: live current status of each vehicle
CREATE TABLE IF NOT EXISTS vehicles (
  id     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spz    text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'idle'
    CHECK (status IN ('driving', 'vacation', 'service', 'idle'))
);

-- fleet_history: audit log of all status intervals
CREATE TABLE IF NOT EXISTS fleet_history (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  spz        text NOT NULL,
  status     text NOT NULL
    CHECK (status IN ('driving', 'vacation', 'service', 'idle')),
  start_time timestamptz NOT NULL DEFAULT now(),
  end_time   timestamptz -- NULL = currently active interval
);

-- Index for fast lookups of open history records per vehicle
CREATE INDEX IF NOT EXISTS idx_fleet_history_vehicle_open
  ON fleet_history (vehicle_id, end_time)
  WHERE end_time IS NULL;

-- Index for history table filtering by start_time
CREATE INDEX IF NOT EXISTS idx_fleet_history_start_time
  ON fleet_history (start_time DESC);

-- ============================================================
-- Seed 6 vehicles (skip if they already exist)
-- ============================================================
INSERT INTO vehicles (spz, status) VALUES
  ('1AB 1234', 'idle'),
  ('2CD 5678', 'idle'),
  ('3EF 9012', 'idle'),
  ('4GH 3456', 'idle'),
  ('5IJ 7890', 'idle'),
  ('6KL 2345', 'idle')
ON CONFLICT (spz) DO NOTHING;

-- ============================================================
-- Enable Realtime on both tables
-- (run these separately if ALTER PUBLICATION fails in a transaction)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE vehicles;
ALTER PUBLICATION supabase_realtime ADD TABLE fleet_history;

-- ============================================================
-- Row Level Security - public access (no auth required)
-- ============================================================
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fleet_history ENABLE ROW LEVEL SECURITY;

-- vehicles: allow all SELECT and UPDATE (no INSERT/DELETE needed from client)
CREATE POLICY "pub_select_vehicles"
  ON vehicles FOR SELECT USING (true);

CREATE POLICY "pub_update_vehicles"
  ON vehicles FOR UPDATE USING (true) WITH CHECK (true);

-- fleet_history: allow SELECT, INSERT, UPDATE (no DELETE from client)
CREATE POLICY "pub_select_history"
  ON fleet_history FOR SELECT USING (true);

CREATE POLICY "pub_insert_history"
  ON fleet_history FOR INSERT WITH CHECK (true);

CREATE POLICY "pub_update_history"
  ON fleet_history FOR UPDATE USING (true) WITH CHECK (true);
