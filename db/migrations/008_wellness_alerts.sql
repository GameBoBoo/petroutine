CREATE TABLE IF NOT EXISTS wellness_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  metric VARCHAR(32) NOT NULL CHECK (metric IN (
    'food_intake', 'water_intake', 'activity_level', 'sleep_amount',
    'stool_condition', 'mood', 'weight_kg'
  )),
  rule_code VARCHAR(48) NOT NULL CHECK (rule_code IN (
    'relative_consecutive', 'category_consecutive', 'weight_percent_consecutive'
  )),
  direction VARCHAR(16) NOT NULL CHECK (direction IN ('below', 'above', 'changed')),
  status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'acknowledged', 'monitoring', 'resolved')),
  baseline_start DATE NOT NULL,
  baseline_end DATE NOT NULL,
  observation_start DATE NOT NULL,
  observation_end DATE NOT NULL,
  baseline_value JSONB NOT NULL,
  observed_value JSONB NOT NULL,
  evidence JSONB NOT NULL,
  source_log_ids UUID[] NOT NULL DEFAULT '{}',
  first_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  acknowledged_by UUID REFERENCES users(id),
  acknowledged_at TIMESTAMPTZ,
  monitoring_by UUID REFERENCES users(id),
  monitoring_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  resolution_reason VARCHAR(32) CHECK (resolution_reason IN ('returned_to_baseline', 'source_changed', 'direction_changed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (baseline_start <= baseline_end),
  CHECK (observation_start <= observation_end),
  CHECK ((status = 'resolved') = (resolved_at IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_wellness_alert_active_rule
  ON wellness_alerts(pet_id, metric, rule_code)
  WHERE status <> 'resolved';

CREATE INDEX IF NOT EXISTS idx_wellness_alert_pet_status
  ON wellness_alerts(pet_id, status, observation_end DESC, id DESC);

CREATE INDEX IF NOT EXISTS idx_wellness_alert_pet_timeline
  ON wellness_alerts(pet_id, first_detected_at DESC, id DESC);
