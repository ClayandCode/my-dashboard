-- Add optional time estimate to habits
ALTER TABLE habits ADD COLUMN IF NOT EXISTS time_estimate_min int;

-- Subtask definitions (checklist items within a habit)
CREATE TABLE IF NOT EXISTS habit_subtasks (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id          uuid        REFERENCES habits(id) ON DELETE CASCADE,
  user_id           text        NOT NULL,
  name              text        NOT NULL,
  sort_order        int         DEFAULT 0,
  time_estimate_min int,
  created_at        timestamptz DEFAULT now()
);
ALTER TABLE habit_subtasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON habit_subtasks USING (true) WITH CHECK (true);

-- Daily subtask completions
CREATE TABLE IF NOT EXISTS habit_subtask_logs (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    text        NOT NULL,
  subtask_id uuid        REFERENCES habit_subtasks(id) ON DELETE CASCADE,
  log_date   date        NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, subtask_id, log_date)
);
ALTER TABLE habit_subtask_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service role full access" ON habit_subtask_logs USING (true) WITH CHECK (true);
