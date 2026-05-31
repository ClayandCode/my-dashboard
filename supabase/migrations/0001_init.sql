-- Enable vector extension for memory/embeddings
create extension if not exists vector;

-- ── entities ──────────────────────────────────────────────
create table entities (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  name        text not null,
  kind        text not null,
  metadata    jsonb default '{}',
  created_at  timestamptz default now()
);

-- ── raw_captures ──────────────────────────────────────────
create table raw_captures (
  id              uuid primary key default gen_random_uuid(),
  user_id         text not null,
  source          text not null,
  raw_text        text,
  audio_url       text,
  classification  jsonb default '{}',
  llm_source      text,
  routed_to       text,
  routed_id       uuid,
  created_at      timestamptz default now()
);

-- ── tasks ─────────────────────────────────────────────────
create table tasks (
  id                  uuid primary key default gen_random_uuid(),
  user_id             text not null,
  title               text not null,
  description         text,
  urgency             text not null default 'someday',
  key                 boolean default false,
  priority_score      float default 0,
  time_estimate_min   int,
  tags                text[] default '{}',
  due_date            date,
  owner               text,
  entity_id           uuid references entities(id) on delete set null,
  completed_at        timestamptz,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- ── daily_logs ────────────────────────────────────────────
create table daily_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  log_date    date not null,
  notes       text,
  mood        int,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now(),
  unique(user_id, log_date)
);

-- ── memory_chunks ─────────────────────────────────────────
create table memory_chunks (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null,
  source_type  text not null,
  source_id    uuid,
  text         text not null,
  embedding    vector(1536),
  created_at   timestamptz default now()
);

create index on memory_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ── audit_log ─────────────────────────────────────────────
create table audit_log (
  id             uuid primary key default gen_random_uuid(),
  user_id        text not null,
  action         text not null,
  resource_type  text,
  resource_id    uuid,
  metadata       jsonb default '{}',
  created_at     timestamptz default now()
);

-- ── RLS: deny all by default (service role bypasses) ──────
alter table entities      enable row level security;
alter table raw_captures  enable row level security;
alter table tasks         enable row level security;
alter table daily_logs    enable row level security;
alter table memory_chunks enable row level security;
alter table audit_log     enable row level security;

-- Updated_at trigger for tasks and daily_logs
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

create trigger daily_logs_updated_at
  before update on daily_logs
  for each row execute function set_updated_at();
