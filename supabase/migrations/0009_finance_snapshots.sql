create table if not exists finance_snapshots (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  snapshot_date date not null default current_date,
  net_worth     numeric(14,2),
  change_amount numeric(14,2),
  categories    jsonb default '[]',
  raw_data      jsonb,
  source_sheet  text,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create unique index if not exists finance_snapshots_user_date
  on finance_snapshots(user_id, snapshot_date);

alter table finance_snapshots enable row level security;

create policy "service role full access" on finance_snapshots
  using (true) with check (true);
