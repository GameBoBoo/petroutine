ALTER TABLE pets
  ADD COLUMN IF NOT EXISTS breed VARCHAR(120),
  ADD COLUMN IF NOT EXISTS sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown')),
  ADD COLUMN IF NOT EXISTS neuter_status VARCHAR(20) CHECK (neuter_status IN ('neutered', 'not_neutered', 'unknown')),
  ADD COLUMN IF NOT EXISTS baseline_weight_kg NUMERIC(8, 3) CHECK (baseline_weight_kg > 0),
  ADD COLUMN IF NOT EXISTS baseline_weight_recorded_on DATE;

CREATE TABLE IF NOT EXISTS pet_passport_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  entry_type VARCHAR(24) NOT NULL CHECK (
    entry_type IN ('allergy', 'condition', 'medication', 'vaccination', 'appointment')
  ),
  title VARCHAR(160) NOT NULL,
  details TEXT,
  numeric_value NUMERIC(12, 3),
  unit VARCHAR(30),
  start_date DATE,
  end_date DATE,
  next_due_date DATE,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (numeric_value IS NULL OR numeric_value >= 0),
  CHECK (numeric_value IS NULL OR unit IS NOT NULL),
  CHECK (end_date IS NULL OR start_date IS NULL OR end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_passport_pet_active
  ON pet_passport_entries(pet_id, entry_type, next_due_date, created_at DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_passport_pet_timeline
  ON pet_passport_entries(pet_id, created_at DESC, id DESC);
