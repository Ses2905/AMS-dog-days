-- Applied to the "Coach OS - Alma Football" Supabase project.
-- A script is an ordered list of plays for a practice or a game.
create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 80),
  practice_id text references public.practices(id) on delete set null,
  game_id text references public.games(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index scripts_practice_idx on public.scripts (practice_id);
create index scripts_game_idx on public.scripts (game_id);

create table public.script_rows (
  script_id uuid not null references public.scripts(id) on delete cascade,
  position integer not null check (position >= 0),
  section text not null default '' check (length(section) <= 40),
  down smallint check (down between 1 and 4),
  distance text not null default '' check (length(distance) <= 20),
  hash text not null default '' check (hash in ('', 'L', 'M', 'R')),
  personnel text not null default '' check (length(personnel) <= 40),
  formation text not null default '' check (length(formation) <= 60),
  motion text not null default '' check (length(motion) <= 60),
  play text not null default '' check (length(play) <= 120),
  defense text not null default '' check (length(defense) <= 60),
  notes text not null default '' check (length(notes) <= 300),
  ran boolean not null default false,
  primary key (script_id, position)
);

alter table public.scripts enable row level security;
alter table public.script_rows enable row level security;
create policy "signed-in access" on public.scripts for all to authenticated using (true) with check (true);
create policy "signed-in access" on public.script_rows for all to authenticated using (true) with check (true);
