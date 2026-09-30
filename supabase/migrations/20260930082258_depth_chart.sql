-- Applied to the "Coach OS - Alma Football" Supabase project.
-- A depth chart shell: positions grouped by unit, players ranked in each. Positions are editable so the shape can follow the coach.
create table public.depth_positions (
  id uuid primary key default gen_random_uuid(),
  unit text not null check (unit in ('offense', 'defense', 'special')),
  name text not null check (length(name) between 1 and 30),
  starters smallint not null default 1 check (starters between 1 and 11),
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.depth_slots (
  position_id uuid not null references public.depth_positions(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  rank integer not null check (rank >= 0),
  primary key (position_id, player_id)
);
create index depth_slots_player_idx on public.depth_slots (player_id);

alter table public.depth_positions enable row level security;
alter table public.depth_slots enable row level security;
create policy "signed-in access" on public.depth_positions for all to authenticated using (true) with check (true);
create policy "signed-in access" on public.depth_slots for all to authenticated using (true) with check (true);

insert into public.depth_positions (unit, name, starters, sort) values
  ('offense', 'QB', 1, 0), ('offense', 'RB', 1, 1), ('offense', 'WR', 3, 2), ('offense', 'TE', 1, 3), ('offense', 'OL', 5, 4),
  ('defense', 'DL', 4, 0), ('defense', 'LB', 3, 1), ('defense', 'CB', 2, 2), ('defense', 'S', 2, 3),
  ('special', 'K', 1, 0), ('special', 'P', 1, 1), ('special', 'Returners', 2, 2), ('special', 'Long Snapper', 1, 3);
