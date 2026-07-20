-- Freedom Funds: Classrooms + Teacher Dashboard
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.
-- Safe to run on its own, after supabase-school.sql.

drop table if exists public.class_members cascade;
drop table if exists public.classes cascade;

create table public.classes (
  id         bigint primary key,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  name       text not null,
  code       text not null unique,
  created_at timestamptz default now()
);

create table public.class_members (
  id         bigint primary key,
  class_id   bigint not null references public.classes(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  joined_at  timestamptz default now(),
  unique (class_id, user_id)
);

alter table public.classes       enable row level security;
alter table public.class_members enable row level security;

-- Any signed-in user can look up a class by its code (needed to join),
-- and teachers manage their own classes.
create policy "read classes"   on public.classes for select using (auth.role() = 'authenticated');
create policy "create classes" on public.classes for insert with check (auth.uid() = teacher_id);
create policy "manage classes" on public.classes for update using (auth.uid() = teacher_id);
create policy "delete classes" on public.classes for delete using (auth.uid() = teacher_id);

-- Students join classes themselves; students see their own memberships;
-- teachers see the members of their classes.
create policy "join class" on public.class_members for insert with check (auth.uid() = user_id);
create policy "see own membership" on public.class_members for select using (
  auth.uid() = user_id
  or exists (select 1 from public.classes c where c.id = class_id and c.teacher_id = auth.uid())
);

-- Teachers can view the school progress of students in their classes.
drop policy if exists "teacher reads student progress" on public.school_progress;
create policy "teacher reads student progress" on public.school_progress for select using (
  exists (
    select 1 from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.user_id = school_progress.user_id and c.teacher_id = auth.uid()
  )
);

-- Teachers can view the names of students in their classes.
drop policy if exists "teacher reads student profiles" on public.profiles;
create policy "teacher reads student profiles" on public.profiles for select using (
  exists (
    select 1 from public.class_members cm
    join public.classes c on c.id = cm.class_id
    where cm.user_id = profiles.id and c.teacher_id = auth.uid()
  )
);
