-- Run this any time you need to restore habits from scratch.
-- Safe to re-run: deletes existing habits for user 'clay' first.

DELETE FROM habit_subtask_logs WHERE user_id = 'clay';
DELETE FROM habit_subtasks       WHERE user_id = 'clay';
DELETE FROM habit_logs           WHERE user_id = 'clay';
DELETE FROM habits               WHERE user_id = 'clay';

INSERT INTO habits (user_id, name, icon, category, sort_order, active) VALUES
  ('clay', 'Morning Routine',  '🌅', 'MORNING', 1, true),
  ('clay', 'Creative Session', '✨', 'OUTPUT',  2, true),
  ('clay', 'Gym',              '🏋️', 'FITNESS', 3, true),
  ('clay', 'Supplements',      '💊', 'HEALTH',  4, true),
  ('clay', 'Finance Overview', '📊', 'OPS',     5, true),
  ('clay', 'Wind-down',        '🌙', 'EVENING', 6, true);

INSERT INTO habit_subtasks (habit_id, user_id, name, sort_order)
SELECT h.id, 'clay', s.name, s.sort_order
FROM habits h, (VALUES
  ('Brush teeth & floss', 1),
  ('Take vitamins',       2),
  ('Put in contacts',     3),
  ('Make bed',            4)
) AS s(name, sort_order)
WHERE h.name = 'Morning Routine' AND h.user_id = 'clay';

INSERT INTO habit_subtasks (habit_id, user_id, name, sort_order, time_estimate_min)
SELECT h.id, 'clay', s.name, s.sort_order, s.mins
FROM habits h, (VALUES
  ('Market research',  1, 15),
  ('Content ideas',    2, 20),
  ('Draft & schedule', 3, 25)
) AS s(name, sort_order, mins)
WHERE h.name = 'Creative Session' AND h.user_id = 'clay';

INSERT INTO habit_subtasks (habit_id, user_id, name, sort_order)
SELECT h.id, 'clay', s.name, s.sort_order
FROM habits h, (VALUES
  ('Take creatine',       1),
  ('Take fiber',          2),
  ('Take fish oil',       3),
  ('Take collagen',       4),
  ('Take digestive',      5),
  ('Drink protein shake', 6)
) AS s(name, sort_order)
WHERE h.name = 'Supplements' AND h.user_id = 'clay';

INSERT INTO habit_subtasks (habit_id, user_id, name, sort_order, time_estimate_min)
SELECT h.id, 'clay', s.name, s.sort_order, s.mins
FROM habits h, (VALUES
  ('Review portfolio',  1, 10),
  ('Check for risks',   2,  5),
  ('Log net worth',     3,  5),
  ('Review spending',   4,  5),
  ('Finance dashboard', 5,  5)
) AS s(name, sort_order, mins)
WHERE h.name = 'Finance Overview' AND h.user_id = 'clay';

INSERT INTO habit_subtasks (habit_id, user_id, name, sort_order)
SELECT h.id, 'clay', s.name, s.sort_order
FROM habits h, (VALUES
  ('Plan tomorrow',    1),
  ('Log a journal',    2),
  ('Turn off screens', 3),
  ('Read',             4)
) AS s(name, sort_order)
WHERE h.name = 'Wind-down' AND h.user_id = 'clay';
