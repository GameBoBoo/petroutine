ALTER TABLE wellness_alerts
  ADD COLUMN IF NOT EXISTS follow_up_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS follow_up_completed_by UUID REFERENCES users(id);

CREATE INDEX IF NOT EXISTS idx_wellness_alert_follow_up_pending
  ON wellness_alerts(follow_up_due_date)
  WHERE status <> 'resolved' AND follow_up_due_date IS NOT NULL AND follow_up_completed_at IS NULL;
