ALTER TABLE households
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_households_active_membership
  ON households(id)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_households_owner_trash
  ON households(owner_id, archived_at DESC)
  WHERE archived_at IS NOT NULL;
