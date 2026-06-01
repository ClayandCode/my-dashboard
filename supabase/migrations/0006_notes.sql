create table if not exists notes (
  id          uuid primary key default gen_random_uuid(),
  user_id     text not null,
  title       text not null,
  content     text,
  tags        text[] default '{}',
  pinned      boolean default false,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create index if not exists notes_user_created on notes(user_id, created_at desc);

create or replace function notes_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger notes_updated_at
  before update on notes
  for each row execute function notes_updated_at();
