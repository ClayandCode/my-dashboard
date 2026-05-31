-- ── Meals log ──────────────────────────────────────────────────────────────
CREATE TABLE meals (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  log_date   date        NOT NULL,
  name       text        NOT NULL,
  kcal       int         NOT NULL DEFAULT 0,
  protein_g  int,
  carbs_g    int,
  fat_g      int,
  source     text        DEFAULT 'manual',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON meals FOR ALL USING (false);

-- ── Habit definitions ───────────────────────────────────────────────────────
CREATE TABLE habits (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  name       text        NOT NULL,
  icon       text,
  sort_order int         DEFAULT 0,
  active     boolean     DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON habits FOR ALL USING (false);

-- ── Daily habit completions ─────────────────────────────────────────────────
CREATE TABLE habit_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  habit_id   uuid        REFERENCES habits(id) ON DELETE CASCADE,
  log_date   date        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, habit_id, log_date)
);
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON habit_logs FOR ALL USING (false);

-- ── Goals / priorities ──────────────────────────────────────────────────────
CREATE TABLE goals (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      text        NOT NULL,
  title        text        NOT NULL,
  timeframe    text        NOT NULL CHECK (timeframe IN ('week', 'month', 'quarter')),
  completed_at timestamptz,
  sort_order   int         DEFAULT 0,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deny all" ON goals FOR ALL USING (false);
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── Default habits seed ─────────────────────────────────────────────────────
INSERT INTO habits (user_id, name, icon, sort_order) VALUES
  ('clay', 'Morning workout', '🏋️', 1),
  ('clay', 'Meditate',        '🧘', 2),
  ('clay', 'Read 30 min',     '📚', 3),
  ('clay', 'Cold shower',     '🚿', 4),
  ('clay', 'No alcohol',      '🚫', 5),
  ('clay', 'Journaling',      '📓', 6);

-- ── Default goals seed ──────────────────────────────────────────────────────
INSERT INTO goals (user_id, title, timeframe, sort_order) VALUES
  ('clay', 'Ship dashboard MVP',   'week',  1),
  ('clay', 'Clear email backlog',  'week',  2),
  ('clay', 'Read one book',        'month', 1),
  ('clay', 'Hit savings target',   'month', 2);
