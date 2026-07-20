-- Freedom Funds: School Mode progress table
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run on its own. (This is separate from supabase-upgrade.sql
-- so re-running never touches your bills or net worth data.)

drop table if exists public.school_progress cascade;

create table public.school_progress (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  lessons    jsonb default '[]',
  quizzes    jsonb default '[]',
  xp         int default 0,
  updated_at timestamptz default now()
);

alter table public.school_progress enable row level security;

create policy "own school progress" on public.school_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
