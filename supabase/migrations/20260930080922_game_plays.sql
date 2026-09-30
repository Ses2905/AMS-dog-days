-- Applied to the "Coach OS - Alma Football" Supabase project.
-- One row per scoring play, for either team.
create table public.game_plays (
  id uuid primary key default gen_random_uuid(),
  game_id text not null references public.games(id) on delete cascade,
  quarter smallint not null check (quarter between 1 and 5),
  team text not null check (team in ('us', 'them')),
  type text not null check (type in ('touchdown', 'field_goal', 'extra_point', 'two_point', 'safety')),
  points smallint not null check (points between 1 and 6),
  player_id text references public.players(id) on delete set null,
  scorer_name text check (length(scorer_name) <= 60),
  detail text check (length(detail) <= 200),
  created_at timestamptz not null default now()
);
create index game_plays_game_idx on public.game_plays (game_id);
create index game_plays_player_idx on public.game_plays (player_id);

alter table public.game_plays enable row level security;
create policy "signed-in access" on public.game_plays for all to authenticated using (true) with check (true);
