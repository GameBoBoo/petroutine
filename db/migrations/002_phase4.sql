ALTER TABLE routines ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_routines_active_pet ON routines(pet_id) WHERE archived_at IS NULL;
