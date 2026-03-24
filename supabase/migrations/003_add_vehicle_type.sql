-- Add vehicle type column
ALTER TABLE vehicles ADD COLUMN type text NOT NULL DEFAULT 'kamion'
  CHECK (type IN ('dodávka', 'kamion'));

-- Replace test data with real vehicles
DELETE FROM fleet_history;
DELETE FROM vehicles;

INSERT INTO vehicles (spz, type, status) VALUES
  ('6SM7428', 'dodávka', 'idle'),
  ('6SM7429', 'dodávka', 'idle'),
  ('1UZ 1408', 'kamion', 'idle'),
  ('1UZ 8160', 'kamion', 'idle'),
  ('1UZ 8168', 'kamion', 'idle'),
  ('1U7 8413', 'kamion', 'idle');
