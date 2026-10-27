ALTER TABLE ai_insight_requests ALTER COLUMN pet_id DROP NOT NULL;
ALTER TABLE ai_insight_requests ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES households(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_insight_requests_household_created ON ai_insight_requests (household_id, created_at DESC);
