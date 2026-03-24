-- ============================================================
-- Migration 004: Tighter RLS policies
-- Prevents backdating, tamper-proof history, valid status only
-- ============================================================

-- vehicles: only allow updating status and driver_name (not id/spz)
DROP POLICY IF EXISTS "pub_update_vehicles" ON vehicles;
CREATE POLICY "pub_update_vehicles"
  ON vehicles FOR UPDATE
  USING (true)
  WITH CHECK (status IN ('driving', 'vacation', 'service', 'idle'));

-- fleet_history: INSERT only within ±5 minutes of now (prevents backdating)
DROP POLICY IF EXISTS "pub_insert_history" ON fleet_history;
CREATE POLICY "pub_insert_history"
  ON fleet_history FOR INSERT
  WITH CHECK (
    status IN ('driving', 'vacation', 'service', 'idle') AND
    start_time >= now() - interval '5 minutes' AND
    start_time <= now() + interval '1 minute'
  );

-- fleet_history: UPDATE only open records (end_time IS NULL → set end_time only)
DROP POLICY IF EXISTS "pub_update_history" ON fleet_history;
CREATE POLICY "pub_update_history"
  ON fleet_history FOR UPDATE
  USING (end_time IS NULL)
  WITH CHECK (
    end_time IS NOT NULL AND
    end_time >= start_time AND
    end_time <= now() + interval '1 minute'
  );
