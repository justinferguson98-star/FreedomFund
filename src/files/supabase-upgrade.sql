-- Freedom Funds: data persistence upgrade
-- Run this once in Supabase: SQL Editor -> New query -> paste everything -> Run.
-- It rebuilds the bills, assets, and liabilities tables to match the app exactly,
-- with row-level security so each user can only ever see their own data.

drop table if exists public.bills cascade;
drop table if exists public.assets cascade;
drop table if exists public.liabilities cascade;

create table public.bills (
  id            bigint primary key,
  user_id       uuid not null references auth.users(id) on delete cascade,
  name          text not null,
  category      text default 'other',
  amount        numeric default 0,
  due_day       int default 1,
  autopay       boolean default false,
  notes         text default '',
  reminder_days int default 3,
  paid_months   jsonb default '[]',
  created_at    timestamptz default now()
);

create table public.assets (
  id         bigint primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  amount     numeric default 0,
  cat        text default 'Other',
  icon       text default 'dollarSign',
  created_at timestamptz default now()
);

create table public.liabilities (
  id         bigint primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  amount     numeric default 0,
  rate       numeric default 0,
  cat        text default 'Other',
  icon       text default 'dollarSign',
  created_at timestamptz default now()
);

alter table public.bills       enable row level security;
alter table public.assets      enable row level security;
alter table public.liabilities enable row level security;

create policy "own bills"       on public.bills       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own assets"      on public.assets      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own liabilities" on public.liabilities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
