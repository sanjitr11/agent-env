create table public.agents (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  user_id      uuid not null references auth.users(id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  type         text not null check (type in ('coding','research','marketing','ops','custom')),
  instructions text check (char_length(instructions) <= 1000),
  created_at   timestamptz not null default now()
);
alter table public.agents enable row level security;
create policy "own" on public.agents for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
