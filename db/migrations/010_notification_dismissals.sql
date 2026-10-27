CREATE TABLE IF NOT EXISTS notification_dismissals (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  notification_key VARCHAR(180) NOT NULL,
  dismissed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, household_id, notification_key),
  CHECK (char_length(notification_key) BETWEEN 1 AND 180)
);

CREATE INDEX IF NOT EXISTS notification_dismissals_household_user_idx
  ON notification_dismissals (household_id, user_id, dismissed_at DESC);
