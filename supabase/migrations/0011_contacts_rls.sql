alter table contacts enable row level security;

create policy "service role full access" on contacts
  using (true) with check (true);
