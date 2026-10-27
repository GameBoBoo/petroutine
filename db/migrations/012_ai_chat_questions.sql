ALTER TABLE ai_insight_requests DROP CONSTRAINT IF EXISTS ai_insight_requests_intent_check;
ALTER TABLE ai_insight_requests ADD CONSTRAINT ai_insight_requests_intent_check
  CHECK (intent IN ('daily_summary', 'wellness_question', 'chat_question', 'care_draft'));
