-- Applied to the "Coach OS - Alma Football" Supabase project.
create table public.games (
  id text primary key,
  date date not null,
  start_time text,
  opponent text not null check (length(opponent) between 1 and 60),
  site text not null default 'home' check (site in ('home', 'away', 'neutral')),
  location text,
  kind text not null default 'game' check (kind in ('game', 'scrimmage', 'other')),
  status text not null default 'scheduled' check (status in ('scheduled', 'final', 'postponed', 'cancelled')),
  score_us smallint check (score_us between 0 and 200),
  score_them smallint check (score_them between 0 and 200),
  links jsonb not null default '[]',
  checklist jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index games_date_idx on public.games (date);

alter table public.games enable row level security;
create policy "signed-in access" on public.games for all to authenticated using (true) with check (true);

alter table public.notes add column game_id text references public.games(id) on delete set null;
create index notes_game_idx on public.notes (game_id);
