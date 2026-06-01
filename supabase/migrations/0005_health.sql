create table if not exists health_logs (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  log_date     date not null default current_date,
  weight_lbs   numeric(5,1),
  sleep_hours  numeric(4,1),
  hrv          integer,
  energy       integer check (energy between 1 and 10),
  water_oz     integer,
  notes        text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  unique (user_id, log_date)
);

create index if not exists health_logs_user_date on health_logs(user_id, log_date desc);
