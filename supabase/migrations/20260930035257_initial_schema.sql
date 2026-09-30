-- Applied to the "Coach OS - Alma Football" Supabase project (us-east-2).
create table public.players (
  id text primary key,
  first_name text not null,
  last_name text not null,
  grade smallint not null check (grade in (8, 9)),
  number smallint not null,
  other_numbers smallint[] not null default '{}',
  status text not null default 'available' check (status in ('available','limited','out','excused')),
  status_note text,
  status_until date,
  created_at timestamptz not null default now()
);

create table public.practices (
  id text primary key,
  date date not null,
  session text not null,
  team text not null default 'Alma Jr. High Football',
  opponent text,
  dress text,
  lift text,
  od_meeting text,
  situations text,
  imported boolean not null default false,
  coaches text[] not null default '{}',
  notes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.practice_blocks (
  id bigint generated always as identity primary key,
  practice_id text not null references public.practices(id) on delete cascade,
  position smallint not null,
  start_time text not null,
  periods smallint not null check (periods > 0),
  span text,
  flex boolean not null default false,
  lanes jsonb not null default '{}',
  unique (practice_id, position)
);

create index practices_date_idx on public.practices (date);

-- Single-user app: only a signed-in user can read or write. Turn off public sign-ups in the dashboard.
alter table public.players enable row level security;
alter table public.practices enable row level security;
alter table public.practice_blocks enable row level security;

create policy "signed-in access" on public.players for all to authenticated using (true) with check (true);
create policy "signed-in access" on public.practices for all to authenticated using (true) with check (true);
create policy "signed-in access" on public.practice_blocks for all to authenticated using (true) with check (true);
