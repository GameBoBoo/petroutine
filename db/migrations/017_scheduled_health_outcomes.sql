CREATE TABLE IF NOT EXISTS scheduled_health_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type VARCHAR(24) NOT NULL CHECK (source_type IN ('passport_due', 'health_appointment')),
  source_id UUID NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(12) NOT NULL CHECK (status IN ('completed', 'skipped', 'pending')),
  skip_reason VARCHAR(160),
  acted_by UUID REFERENCES users(id),
  acted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (source_type, source_id, due_date)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_health_outcomes_source
  ON scheduled_health_outcomes(source_type, source_id, due_date);
