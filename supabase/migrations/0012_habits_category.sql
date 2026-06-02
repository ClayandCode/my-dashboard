alter table habits add column if not exists category text;

-- Set default categories for existing seed habits
update habits set category = 'FITNESS'  where name ilike '%workout%' or name ilike '%gym%';
update habits set category = 'HEALTH'   where name ilike '%meditat%' or name ilike '%shower%' or name ilike '%supplement%';
update habits set category = 'LEARNING' where name ilike '%read%';
update habits set category = 'EVENING'  where name ilike '%journal%';
