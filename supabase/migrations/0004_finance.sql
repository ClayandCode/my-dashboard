create table if not exists transactions (
  id            uuid primary key default gen_random_uuid(),
  user_id       text not null,
  date          date not null default current_date,
  description   text not null,
  amount        numeric(12,2) not null,
  category      text not null check (category in ('income','expense','investment')),
  tags          text[] default '{}',
  notes         text,
  source        text default 'web',
  created_at    timestamptz default now()
);

create index if not exists transactions_user_date on transactions(user_id, date desc);
