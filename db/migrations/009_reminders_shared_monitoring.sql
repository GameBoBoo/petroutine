ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS health_reminder_days INTEGER NOT NULL DEFAULT 30;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_settings_health_reminder_days_check'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_health_reminder_days_check
      CHECK (health_reminder_days IN (7, 14, 30, 60, 90));
  END IF;
END $$;

ALTER TABLE wellness_alerts
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS follow_up_due_date DATE,
  ADD COLUMN IF NOT EXISTS follow_up_note TEXT,
  ADD COLUMN IF NOT EXISTS follow_up_updated_by UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS follow_up_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wellness_alerts_follow_up_note_check'
  ) THEN
    ALTER TABLE wellness_alerts ADD CONSTRAINT wellness_alerts_follow_up_note_check
      CHECK (follow_up_note IS NULL OR char_length(follow_up_note) <= 1000);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wellness_alert_follow_up
  ON wellness_alerts(assigned_to, follow_up_due_date, status)
  WHERE status <> 'resolved';
