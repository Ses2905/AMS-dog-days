-- Applied to the "Coach OS - Alma Football" Supabase project.
create table public.attendance (
  practice_id text not null references public.practices(id) on delete cascade,
  player_id text not null references public.players(id) on delete cascade,
  status text not null check (status in ('present', 'late', 'absent', 'excused')),
  updated_at timestamptz not null default now(),
  primary key (practice_id, player_id)
);
create index attendance_player_idx on public.attendance (player_id);

alter table public.attendance enable row level security;
create policy "signed-in access" on public.attendance for all to authenticated using (true) with check (true);
