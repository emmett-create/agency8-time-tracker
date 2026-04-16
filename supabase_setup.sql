-- Run this in Supabase → SQL Editor to create the time_entries table

create table time_entries (
  id               uuid default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  employee_name    text not null,
  client           text not null,
  task_type        text not null,
  duration_minutes int  not null,
  entry_date       date not null,
  notes            text default ''
);

-- Allow the extension and web app to read/write with the anon key
alter table time_entries enable row level security;
create policy "Allow all for anon" on time_entries for all using (true) with check (true);
