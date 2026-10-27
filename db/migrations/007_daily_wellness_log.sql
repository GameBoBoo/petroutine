CREATE TABLE IF NOT EXISTS pet_wellness_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ NOT NULL,
  food_intake VARCHAR(16) CHECK (food_intake IN ('very_low', 'low', 'usual', 'high', 'very_high')),
  water_intake VARCHAR(16) CHECK (water_intake IN ('very_low', 'low', 'usual', 'high', 'very_high')),
  activity_level VARCHAR(16) CHECK (activity_level IN ('very_low', 'low', 'usual', 'high', 'very_high')),
  sleep_amount VARCHAR(16) CHECK (sleep_amount IN ('very_low', 'low', 'usual', 'high', 'very_high')),
  stool_condition VARCHAR(20) CHECK (stool_condition IN ('normal', 'soft', 'watery', 'hard', 'not_observed')),
  mood VARCHAR(16) CHECK (mood IN ('usual', 'bright', 'quiet', 'restless', 'irritable')),
  weight_kg NUMERIC(8, 3) CHECK (weight_kg > 0 AND weight_kg <= 1000),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (
    food_intake IS NOT NULL OR water_intake IS NOT NULL OR activity_level IS NOT NULL OR
    sleep_amount IS NOT NULL OR stool_condition IS NOT NULL OR mood IS NOT NULL OR
    weight_kg IS NOT NULL OR notes IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS idx_wellness_pet_active_recorded
  ON pet_wellness_logs(pet_id, recorded_at DESC, id DESC)
  WHERE archived_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_wellness_pet_timeline
  ON pet_wellness_logs(pet_id, recorded_at DESC, id DESC);
