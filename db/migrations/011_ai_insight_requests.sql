ALTER TABLE households ADD COLUMN IF NOT EXISTS ai_enabled BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS ai_insight_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  intent VARCHAR(30) NOT NULL CHECK (intent IN ('daily_summary', 'wellness_question')),
  range_from DATE NOT NULL,
  range_to DATE NOT NULL,
  provider VARCHAR(60) NOT NULL,
  model VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL CHECK (status IN ('started', 'success', 'failed')),
  source_ids UUID[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE ai_insight_requests DROP CONSTRAINT IF EXISTS ai_insight_requests_status_check;
ALTER TABLE ai_insight_requests ADD CONSTRAINT ai_insight_requests_status_check
  CHECK (status IN ('started', 'success', 'failed'));
CREATE INDEX IF NOT EXISTS idx_ai_insight_requests_user_created
  ON ai_insight_requests (user_id, created_at DESC);
