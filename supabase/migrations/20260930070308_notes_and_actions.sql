-- Applied to the "Coach OS - Alma Football" Supabase project.
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'note' check (kind in ('note', 'action')),
  body text not null check (length(body) between 1 and 2000),
  status text not null default 'open' check (status in ('open', 'done')),
  due_date date,
  owner text references public.coaches(id) on delete set null,
  player_id text references public.players(id) on delete set null,
  practice_id text references public.practices(id) on delete set null,
  opponent text,
  source text not null default 'manual' check (source in ('manual', 'plaud')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  done_at timestamptz
);

create index notes_created_idx on public.notes (created_at desc);
create index notes_practice_idx on public.notes (practice_id);
create index notes_player_idx on public.notes (player_id);

alter table public.notes enable row level security;
create policy "signed-in access" on public.notes for all to authenticated using (true) with check (true);
