ALTER TABLE households ADD COLUMN IF NOT EXISTS invite_expires_at timestamptz DEFAULT (NOW() + INTERVAL '7 days');
ALTER TABLE pets ADD COLUMN IF NOT EXISTS emergency_contact text;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE wellness_alerts ADD COLUMN IF NOT EXISTS follow_up_result text;
