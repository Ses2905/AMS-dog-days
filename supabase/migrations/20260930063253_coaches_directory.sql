-- Applied to the "Coach OS - Alma Football" Supabase project.
create table public.coaches (
  id text primary key,
  first_name text,
  last_name text not null,
  role text not null default 'Coach',
  active boolean not null default true,
  sort smallint not null default 0,
  created_at timestamptz not null default now()
);

alter table public.coaches enable row level security;
create policy "signed-in access" on public.coaches for all to authenticated using (true) with check (true);
