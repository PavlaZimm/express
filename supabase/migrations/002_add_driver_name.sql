-- Add driver_name to vehicles
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS driver_name text;

-- Update with real SPZ and driver names (fill in when received from user)
-- Example:
-- UPDATE vehicles SET driver_name = 'Jan Novák' WHERE spz = '1AB 1234';
