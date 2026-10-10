CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE, password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS households (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name VARCHAR(120) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id), invite_code VARCHAR(32) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS household_members (
  household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'member', 'caregiver')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), PRIMARY KEY (household_id, user_id)
);
CREATE TABLE IF NOT EXISTS pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), household_id UUID NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL, species VARCHAR(10) NOT NULL CHECK (species IN ('dog', 'cat')),
  birth_date DATE, photo_url TEXT, notes TEXT, vet_contact VARCHAR(255), archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS routines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL, activity_type VARCHAR(40) NOT NULL, schedule_value JSONB NOT NULL,
  assigned_user_id UUID REFERENCES users(id), instructions TEXT, active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS care_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), routine_id UUID NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'skipped', 'overdue')),
  completed_by UUID REFERENCES users(id), completed_at TIMESTAMPTZ, notes TEXT,
  UNIQUE (routine_id, scheduled_at)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_pets_household ON pets(household_id);
CREATE INDEX IF NOT EXISTS idx_routines_pet ON routines(pet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled ON care_tasks(scheduled_at);
