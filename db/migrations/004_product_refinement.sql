ALTER TABLE care_tasks
  ADD COLUMN IF NOT EXISTS assigned_user_id UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS original_scheduled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mutation_version INTEGER NOT NULL DEFAULT 0 CHECK (mutation_version >= 0),
  ADD COLUMN IF NOT EXISTS mutation_reason TEXT,
  ADD COLUMN IF NOT EXISTS skip_reason TEXT;

UPDATE care_tasks AS task
SET assigned_user_id = routine.assigned_user_id
FROM routines AS routine
WHERE routine.id = task.routine_id
  AND task.assigned_user_id IS NULL
  AND routine.assigned_user_id IS NOT NULL;

UPDATE care_tasks
SET original_scheduled_at = scheduled_at
WHERE original_scheduled_at IS NULL;

CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID REFERENCES households(id) ON DELETE CASCADE,
  actor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action VARCHAR(40) NOT NULL,
  entity_type VARCHAR(40) NOT NULL,
  entity_id UUID NOT NULL,
  before_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  entity_version INTEGER,
  reversible_until TIMESTAMPTZ,
  reversed_activity_id UUID REFERENCES activity_logs(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS care_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  activity_type VARCHAR(40) NOT NULL CHECK (
    activity_type IN ('feeding', 'water', 'walk', 'grooming', 'medication', 'vet', 'bathing', 'supplies', 'observation', 'other')
  ),
  occurred_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pet_health_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  record_type VARCHAR(30) NOT NULL CHECK (
    record_type IN ('weight', 'vaccination', 'medication', 'appointment', 'observation', 'other')
  ),
  title VARCHAR(160) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL,
  details TEXT,
  numeric_value NUMERIC(12, 3),
  unit VARCHAR(30),
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (numeric_value IS NULL OR numeric_value >= 0)
);

CREATE TABLE IF NOT EXISTS idempotency_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  operation VARCHAR(80) NOT NULL,
  request_key VARCHAR(120) NOT NULL,
  request_fingerprint VARCHAR(64) NOT NULL,
  response_status INTEGER NOT NULL CHECK (response_status BETWEEN 200 AND 599),
  response_body JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, operation, request_key)
);

ALTER TABLE idempotency_records
  ADD COLUMN IF NOT EXISTS request_fingerprint VARCHAR(64);
UPDATE idempotency_records
SET request_fingerprint = repeat('0', 64)
WHERE request_fingerprint IS NULL;
ALTER TABLE idempotency_records
  ALTER COLUMN request_fingerprint SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activity_logs_household_created
  ON activity_logs(household_id, created_at DESC, id DESC)
  WHERE household_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor_created
  ON activity_logs(actor_user_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity
  ON activity_logs(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action
  ON activity_logs(household_id, action, created_at DESC)
  WHERE household_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_care_entries_household_occurred
  ON care_entries(household_id, occurred_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_care_entries_pet_active
  ON care_entries(pet_id, occurred_at DESC, id DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_health_records_pet_recorded
  ON pet_health_records(pet_id, recorded_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_health_records_pet_active
  ON pet_health_records(pet_id, record_type, recorded_at DESC, id DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_idempotency_expires
  ON idempotency_records(expires_at);
