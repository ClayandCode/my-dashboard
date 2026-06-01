create table if not exists contacts (
  id                uuid primary key default gen_random_uuid(),
  user_id           text not null,
  name              text not null,
  relationship      text default 'other' check (relationship in ('friend','family','business','other')),
  last_contact_date date,
  followup_date     date,
  notes             text,
  tags              text[] default '{}',
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

create index if not exists contacts_user_name on contacts(user_id, name);

create trigger contacts_updated_at
  before update on contacts
  for each row execute function set_updated_at();
