-- Applied to the "Coach OS - Alma Football" Supabase project.
-- Results from the assistant's workflows that the coach chose to keep.
create table public.saved_outputs (
  id uuid primary key default gen_random_uuid(),
  workflow text not null check (length(workflow) between 1 and 60),
  title text not null check (length(title) between 1 and 120),
  body text not null check (length(body) between 1 and 20000),
  game_id text references public.games(id) on delete set null,
  player_id text references public.players(id) on delete set null,
  created_at timestamptz not null default now()
);
create index saved_outputs_game_idx on public.saved_outputs (game_id);

alter table public.saved_outputs enable row level security;
create policy "signed-in access" on public.saved_outputs for all to authenticated using (true) with check (true);
